import type { NextApiRequest, NextApiResponse } from "next";
import { tx } from "../../../src/backend/pg";
import {
  getChangedEntries,
  getChangedLastMutationIDs,
  getClientGroup,
  getGlobalVersion,
} from "../../../src/backend/data";
import { z } from "zod";
import type { PullResponse } from "replicache";

const pullRequestSchema = z.object({
  clientGroupID: z.string(),
  cookie: z.union([z.number(), z.null()]),
});

type PullRequest = z.infer<typeof pullRequestSchema>;

const authError = {};

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const { body: requestBody } = req;
  const userID = req.cookies["userID"] ?? "anon";

  console.log(`Processing pull`, JSON.stringify(requestBody, null, ""));
  const pullRequest = pullRequestSchema.parse(requestBody);

  let pullResponse: PullResponse;
  try {
    pullResponse = await processPull(pullRequest, userID);
  } catch (e) {
    if (e === authError) {
      res.status(401).send("Unauthorized");
    } else {
      console.error("Error processing pull:", e);
      res.status(500).send("Internal Server Error");
    }
    return;
  }

  res.status(200).json(pullResponse);
}

async function processPull(req: PullRequest, userID: string) {
  const { clientGroupID, cookie: requestCookie } = req;

  const t0 = Date.now();

  const [entries, lastMutationIDChanges, responseCookie] = await tx(
    async (executor) => {
      const clientGroup = await getClientGroup(executor, req.clientGroupID);
      if (clientGroup && clientGroup.userID !== userID) {
        throw authError;
      }

      return Promise.all([
        getChangedEntries(executor, requestCookie ?? 0),
        getChangedLastMutationIDs(executor, clientGroupID, requestCookie ?? 0),
        getGlobalVersion(executor),
      ]);
    }
  );

  console.log("lastMutationIDChanges: ", lastMutationIDChanges);
  console.log("responseCookie: ", responseCookie);
  console.log("Read all objects in", Date.now() - t0);

  // TODO: Return ClientStateNotFound for Replicache 13 to handle case where
  // server state deleted.

  const res: PullResponse = {
    lastMutationIDChanges,
    cookie: responseCookie,
    patch: [],
  };

  for (const [key, value, deleted] of entries) {
    if (deleted) {
      res.patch.push({
        op: "del",
        key,
      });
    } else {
      res.patch.push({
        op: "put",
        key,
        value,
      });
    }
  }

  console.log(`Returning`, JSON.stringify(res, null, ""));
  return res;
}
