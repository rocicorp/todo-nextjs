import type { NextApiRequest, NextApiResponse } from "next";
import { pull } from "../../backend/pull";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const spaceID = req.query["spaceID"].toString();
  const resp = await pull(spaceID, req.body);
  res.json(resp);
  res.end();
};
