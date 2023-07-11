import { getSupabaseClientConfig } from "../backend/supabase";
import { createClient } from "@supabase/supabase-js";

// Implements a Replicache poke using Supabase's realtime functionality.
// See: backend/poke/supabase.ts.
export function listen(onPoke: () => Promise<void>) {
  const supabaseClientConfig = getSupabaseClientConfig();
  const { url, key } = supabaseClientConfig;
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
