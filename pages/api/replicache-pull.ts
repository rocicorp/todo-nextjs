import type { NextApiRequest, NextApiResponse } from "next";
import { LogContext } from "@rocicorp/logger";
import { pull } from "replicache-simple-backend";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const spaceID = req.query["spaceID"].toString();
  const respBody = await pull(new LogContext("debug"), {
    spaceID,
    body: req.body as string,
  });
  res.status(200).json(respBody);
  res.end();
};
