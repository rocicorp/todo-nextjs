import App from "../src/frontend/app";
import { M, mutators } from "../src/mutators";
import { useEffect, useState } from "react";
import { Replicache } from "replicache";
import { createClient } from "@supabase/supabase-js";
import { getAPIKey, getProjectURL } from "../src/supabase";

export default function Home() {
  const [rep, setRep] = useState<Replicache<M> | null>(null);

  useEffect(() => {
    const r = new Replicache({
      // See https://doc.replicache.dev/licensing for how to get a license key.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      licenseKey: process.env.NEXT_PUBLIC_REPLICACHE_LICENSE_KEY!,
      pushURL: `/api/replicache/push`,
      pullURL: `/api/replicache/pull`,
      name: "anon",
      mutators,
    });

    const unlisten = listen(async () => r.pull());
    setRep(r);

    return () => {
      unlisten();
      void r.close();
    };
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

// Implements a Replicache poke using Supabase's realtime functionality.
// See: backend/poke/supabase.ts.
function listen(onPoke: () => Promise<void>) {
  const url = getProjectURL();
  const key = getAPIKey();
  const supabase = createClient(url, key);
  const subscriptionChannel = supabase.channel("public:meta");
  subscriptionChannel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "meta",
        filter: "key=eq.globalVersion",
      },
      () => {
        void onPoke();
      }
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(subscriptionChannel);
  };
}
