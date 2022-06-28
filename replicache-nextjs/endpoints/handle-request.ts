import { NextApiRequest, NextApiResponse } from "next";
import { MutatorDefs } from "replicache";
import { handlePokeSSE } from "./replicache-poke-sse";
import { handlePull } from "./replicache-pull";
import { handlePush } from "./replicache-push";

export async function handleRequest<M extends MutatorDefs>(
  req: NextApiRequest,
  res: NextApiResponse,
  mutators: M
) {
  const op = req.query["op"] as string;
  console.log(`Handling request ${req.url}, op: ${op}`);

  switch (op) {
    case "push":
      return await handlePush(req, res, mutators);
    case "pull":
      return await handlePull(req, res);
    case "poke-sse":
      return await handlePokeSSE(req, res);
  }

  res.status(404).send("route not found");
}
