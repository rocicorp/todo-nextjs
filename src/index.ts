import { NextApiRequest, NextApiResponse } from "next";
import { getCookie, createSpace as createSpaceImpl } from "./backend/data";
import { handleRequest as handleRequestImpl } from "./endpoints/handle-request";
import { transact } from "./backend/pg";
import { MutatorDefs } from "replicache";
// import { getPokeReceiver } from "./frontend/poke";
// import { useReplicache } from "./frontend/use-replicache";
import { getSupabaseClientConfig } from "./backend/supabase";

export async function spaceExists(spaceID: string) {
  const cookie = await transact(async (executor) => {
    return await getCookie(executor, spaceID);
  });
  return cookie !== undefined;
}

export async function createSpace(spaceID: string) {
  await transact(async (executor) => {
    await createSpaceImpl(executor, spaceID);
  });
}

export async function handleRequest<M extends MutatorDefs>(
  req: NextApiRequest,
  res: NextApiResponse,
  mutators: M
) {
  await handleRequestImpl(req, res, mutators);
}

export {getSupabaseClientConfig};
export type SupabaseClientConfig = ReturnType<typeof getSupabaseClientConfig>;