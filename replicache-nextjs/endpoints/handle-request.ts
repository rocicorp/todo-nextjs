import { NextApiRequest, NextApiResponse } from "next";
import { handlePokeSSE } from "./replicache-poke-sse";
import { handlePull } from "./replicache-pull";
import { handlePush } from "./replicache-push";

const handlers = {
  push: handlePush,
  pull: handlePull,
  "poke-sse": handlePokeSSE,
} as Record<string, typeof handlePush>;

export async function handleRequest(req: NextApiRequest, res: NextApiResponse) {
  const op = req.query["op"] as string;
  console.log(`Handling request ${req.url}, op: ${op}`);

  const handler = handlers[op];
  if (!handler) {
    res.status(404).send("route not found");
    return;
  }

  await handler(req, res);
}
