import {
  getSupabaseClientConfig,
  SupabaseClientConfig,
} from "../backend/supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseClientConfig = getSupabaseClientConfig();

// Returns a function that can be used to listen for pokes from the backend.
// This sample supports two different ways to do it.
export function getPokeReceiver() {
  if (supabaseClientConfig) {
    console.log("Creating supabaseReceiver");
    return supabaseReceiver.bind(null, supabaseClientConfig);
  } else {
    console.log("Creating sseReceiver");
    return sseReceiver;
  }
}

// Implements a Replicache poke using Supabase's realtime functionality.
// See: backend/poke/supabase.ts.
function supabaseReceiver(
  supabaseClientConfig: SupabaseClientConfig,
  spaceID: string,
  onPoke: () => Promise<void>
) {
  const { url, key } = supabaseClientConfig;
  const supabase = createClient(url, key);
  supabase
    .from(`space:id=eq.${spaceID}`)
    .on("*", async () => {
      await onPoke();
    })
    .subscribe();
}

// Implements a Replicache poke using Server-Sent Events.
// See: backend/poke/sse.ts.
function sseReceiver(spaceID: string, onPoke: () => Promise<void>) {
  const ev = new EventSource(`/api/replicache/poke-sse?spaceID=${spaceID}`, {
    withCredentials: true,
  });
  ev.onmessage = async (event) => {
    if (event.data === "poke") {
      await onPoke();
    }
  };
}
