import type { NextApiRequest, NextApiResponse } from "next";
import { MutatorDefs } from "replicache";
import { push } from "../backend/push";

export async function handlePush<M extends MutatorDefs>(
  req: NextApiRequest,
  res: NextApiResponse,
  mutators: M
) {
  const spaceID = req.query["spaceID"].toString();
  await push(spaceID, req.body, mutators);
  res.status(200).json({});
}
