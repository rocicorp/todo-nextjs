import { getSupabaseClientConfig } from "../backend/supabase";
import { createClient } from "@supabase/supabase-js";

// Implements a Replicache poke using Supabase's realtime functionality.
// See: backend/poke/supabase.ts.
export function listen(spaceID: string, onPoke: () => Promise<void>) {
  const supabaseClientConfig = getSupabaseClientConfig();
  const { url, key } = supabaseClientConfig;
  const supabase = createClient(url, key);
  const subscriptionChannel = supabase.channel("public:space");
  subscriptionChannel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "space",
        filter: `id=eq.${spaceID}`,
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
