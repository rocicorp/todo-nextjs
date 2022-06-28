import { useEffect, useState } from "react";
import { MutatorDefs, Replicache } from "replicache";
import { getPokeReceiver } from "./poke";

export function useReplicache<M extends MutatorDefs>(
  spaceID: string,
  mutators: M
) {
  const [rep, setRep] = useState<Replicache<M> | null>(null);

  // Currently Replicache is only supported on the client-side. The useEffect()
  // here is a common hack to prevent next from running the code server-side.
  useEffect(() => {
    (async () => {
      if (rep) {
        return;
      }

      const r = new Replicache({
        // See https://doc.replicache.dev/licensing for how to get a license key.
        licenseKey: process.env.NEXT_PUBLIC_REPLICACHE_LICENSE_KEY!,
        pushURL: `/api/replicache/push?spaceID=${spaceID}`,
        pullURL: `/api/replicache/pull?spaceID=${spaceID}`,
        name: spaceID,
        mutators,
      });

      // Replicache uses an empty "poke" message sent over some pubsub channel
      // to know when to pull changes from the server. There are many ways to
      // implement pokes. This sample app implements two different ways.
      // By default, we use Server-Sent Events. This is simple, cheap, and fast,
      // but requires a stateful server to keep the SSE channels open. For
      // serverless platforms we also support pokes via Supabase. See:
      // - https://doc.replicache.dev/deploy
      // - https://doc.replicache.dev/how-it-works#poke-optional
      // - https://github.com/supabase/realtime
      // - https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
      const pokeReceiver = getPokeReceiver();
      pokeReceiver(spaceID, async () => {
        await r.pull();
      });

      setRep(r);
    })();
  }, [spaceID, mutators]);

  if (!rep) {
    return null;
  }

  return rep;
}
