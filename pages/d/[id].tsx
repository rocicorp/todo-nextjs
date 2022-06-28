import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";

import App from "../../src/app";

import { Replicache } from "replicache";
import { M, mutators } from "../../src/mutators";
import { transact } from "../../replicache-nextjs/backend/pg";
import { getCookie } from "../../replicache-nextjs/backend/data";
import { getPokeReceiver } from "../../replicache-nextjs/frontend/poke";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const [, , spaceID] = context.resolvedUrl.split("/");
  if (spaceID === undefined) {
    throw new Error("Missing spaceID path component");
  }

  // Ensure the selected space exists. If it doesn't pick a new one. It's common
  // during development for developers to delete the backend database. As a
  // convenience, we automatically pick a new one when this occurs by
  // redirecting back to the root.
  const cookie = await transact(async (executor) => {
    return await getCookie(executor, spaceID);
  });

  if (cookie === undefined) {
    return {
      redirect: {
        destination: `/`,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default function Home() {
  const [rep, setRep] = useState<Replicache<M> | null>(null);

  // Currently Replicache is only supported on the client-side. The useEffect()
  // here is a common hack to prevent next from running the code server-side.
  useEffect(() => {
    (async () => {
      if (rep) {
        return;
      }

      // Construct our Replicache instance, registering our mutators which will
      // be used to make changes to our data.
      const [, , spaceID] = location.pathname.split("/");
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
  }, []);

  if (!rep) {
    return null;
  }

  return (
    <div className="todoapp">
      <App rep={rep} />
    </div>
  );
}
