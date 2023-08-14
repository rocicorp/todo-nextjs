import App from "../src/frontend/app";
import { M, mutators } from "../src/mutators";
import { useEffect, useState } from "react";
import { Replicache } from "replicache";
import { createClient } from "@supabase/supabase-js";
import { getAPIKey, getProjectURL } from "../src/supabase";
import Cookies from "js-cookie";
import { nanoid } from "nanoid";

export default function Home() {
  const [rep, setRep] = useState<Replicache<M> | null>(null);

  useEffect(() => {
    let userID = Cookies.get("userID");
    if (!userID) {
      userID = nanoid();
      Cookies.set("userID", userID);
    }

    const r = new Replicache({
      // See https://doc.replicache.dev/licensing for how to get a license key.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      licenseKey: process.env.NEXT_PUBLIC_REPLICACHE_LICENSE_KEY!,
      pushURL: `/api/replicache/push`,
      pullURL: `/api/replicache/pull`,
      name: userID,
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
  const subscriptionChannel = supabase.channel("public:replicache_space");
  subscriptionChannel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "replicache_space",
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
