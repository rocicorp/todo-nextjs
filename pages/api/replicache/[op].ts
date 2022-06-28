import { NextApiRequest, NextApiResponse } from "next";
import { handleRequest } from "../../../replicache-nextjs/endpoints/handle-request";
import { mutators } from "../../../src/mutators";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await handleRequest(req, res, mutators);
};
