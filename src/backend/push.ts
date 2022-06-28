import { transact } from "./pg";
import {
  getCookie,
  getLastMutationID,
  setCookie,
  setLastMutationID,
} from "./data";
import { ReplicacheTransaction } from "./replicache-transaction";
import { z } from "zod";
import { parseIfDebug } from "@rocicorp/rails";
import { getPokeBackend } from "./poke/poke";
import { MutatorDefs } from "replicache";

const mutationSchema = z.object({
  id: z.number(),
  name: z.string(),
  args: z.any(),
});

const pushRequestSchema = z.object({
  clientID: z.string(),
  mutations: z.array(mutationSchema),
});

export type Error = "SpaceNotFound";

export async function push<M extends MutatorDefs>(
  spaceID: string,
  requestBody: any,
  mutators: M
) {
  console.log("Processing push", JSON.stringify(requestBody, null, ""));

  const push = parseIfDebug(pushRequestSchema, requestBody);

  const t0 = Date.now();
  await transact(async (executor) => {
    const prevVersion = await getCookie(executor, spaceID);
    if (prevVersion === undefined) {
      throw new Error(`Unknown space ${spaceID}`);
    }

    const nextVersion = prevVersion + 1;
    let lastMutationID =
      (await getLastMutationID(executor, push.clientID)) ?? 0;

    console.log("prevVersion: ", prevVersion);
    console.log("lastMutationID:", lastMutationID);

    const tx = new ReplicacheTransaction(
      executor,
      spaceID,
      push.clientID,
      nextVersion
    );

    for (let i = 0; i < push.mutations.length; i++) {
      const mutation = push.mutations[i];
      const expectedMutationID = lastMutationID + 1;

      if (mutation.id < expectedMutationID) {
        console.log(
          `Mutation ${mutation.id} has already been processed - skipping`
        );
        continue;
      }
      if (mutation.id > expectedMutationID) {
        console.warn(`Mutation ${mutation.id} is from the future - aborting`);
        break;
      }

      console.log("Processing mutation:", JSON.stringify(mutation, null, ""));

      const t1 = Date.now();
      const mutator = (mutators as any)[mutation.name];
      if (!mutator) {
        console.error(`Unknown mutator: ${mutation.name} - skipping`);
      }

      try {
        await mutator(tx, mutation.args);
      } catch (e) {
        console.error(
          `Error executing mutator: ${JSON.stringify(mutator)}: ${e}`
        );
      }

      lastMutationID = expectedMutationID;
      console.log("Processed mutation in", Date.now() - t1);
    }

    await Promise.all([
      setLastMutationID(executor, push.clientID, lastMutationID),
      setCookie(executor, spaceID, nextVersion),
      tx.flush(),
    ]);

    const pokeBackend = getPokeBackend();
    await pokeBackend.poke(spaceID);
  });

  console.log("Processed all mutations in", Date.now() - t0);
}
