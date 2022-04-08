import type { NextApiRequest, NextApiResponse } from "next";
import { LogContext } from "@rocicorp/logger";
import { push } from "replicache-simple-backend";
import { mutators } from "../../frontend/mutators";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const spaceID = req.query["spaceID"].toString();
  await push(
    new LogContext("debug"),
    { spaceID, body: req.body as string },
    mutators
  );
  res.status(200).json({});
};
