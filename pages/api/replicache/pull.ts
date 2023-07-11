import type { NextApiRequest, NextApiResponse } from "next";
import { transact } from "../../../src/backend/pg";
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

  if (req.query["spaceID"] === undefined) {
    res.status(400).send("Missing spaceID");
    return;
  }
  const spaceID = req.query["spaceID"].toString() as string;
  const pull = pullRequest.parse(requestBody);
  const requestCookie = pull.cookie;

  console.log("spaceID", spaceID);
  console.log("clientID", pull.clientID);

  const t0 = Date.now();

  const [entries, lastMutationID, responseCookie] = await transact(
    async (executor) => {
      return Promise.all([
        getChangedEntries(executor, spaceID, requestCookie ?? 0),
        getLastMutationID(executor, pull.clientID),
        getCookie(executor, spaceID),
      ]);
    }
  );

  console.log("lastMutationID: ", lastMutationID);
  console.log("responseCookie: ", responseCookie);
  console.log("Read all objects in", Date.now() - t0);

  if (responseCookie === undefined) {
    throw new Error(`Unknown space ${spaceID}`);
  }

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