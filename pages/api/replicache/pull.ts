import type { NextApiRequest, NextApiResponse } from "next";
import { tx } from "../../../src/backend/pg";
import {
  getChangedEntries,
  getCookie,
  getLastMutationID,
} from "../../../src/backend/data";
import { z } from "zod";
import type { PullResponse } from "replicache";

const pullRequest = z.object({
  clientID: z.string(),
  cookie: z.union([z.number(), z.null()]),
});

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const { body: requestBody } = req;

  console.log(`Processing pull`, JSON.stringify(requestBody, null, ""));

  const pull = pullRequest.parse(requestBody);
  const requestCookie = pull.cookie;

  console.log("clientID", pull.clientID);

  const t0 = Date.now();

  const [entries, lastMutationID, responseCookie] = await tx(
    async (executor) => {
      return Promise.all([
        getChangedEntries(executor, requestCookie ?? 0),
        getLastMutationID(executor, pull.clientID),
        getCookie(executor),
      ]);
    }
  );

  console.log("lastMutationID: ", lastMutationID);
  console.log("responseCookie: ", responseCookie);
  console.log("Read all objects in", Date.now() - t0);

  // TODO: Return ClientStateNotFound for Replicache 13 to handle case where
  // server state deleted.

  const resp: PullResponse = {
    lastMutationID: lastMutationID ?? 0,
    cookie: responseCookie,
    patch: [],
  };

  for (const [key, value, deleted] of entries) {
    if (deleted) {
      resp.patch.push({
        op: "del",
        key,
      });
    } else {
      resp.patch.push({
        op: "put",
        key,
        value,
      });
    }
  }

  console.log(`Returning`, JSON.stringify(resp, null, ""));
  res.json(resp);
  res.end();
}
