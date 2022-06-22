import type { NextApiRequest, NextApiResponse } from "next";
import { listen } from "../../backend/poke";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const spaceID = req.query["spaceID"].toString();

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");

  res.write(`id: ${Date.now()}\n`);
  res.write(`data: hello\n\n`);

  const unlisten = listen(spaceID, () => {
    res.write(`id: ${Date.now()}\n`);
    res.write(`data: poke\n\n`);
  });

  setInterval(() => {
    res.write(`id: ${Date.now()}\n`);
    res.write(`data: beat\n\n`);
  }, 30 * 1000);

  res.on("close", () => {
    unlisten();
  });
};
