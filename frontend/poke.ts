import { supabaseConfig } from "../backend/supabase";
import { createClient } from "@supabase/supabase-js";

export function getPokeReceiver() {
  if (supabaseConfig) {
    return supabaseReceiver;
  } else {
    return sseReceiver;
  }
}

// Implements a Replicache poke using Supabase's realtime functionality.
// See: backend/poke/supabase.ts.
function supabaseReceiver(spaceID: string, onPoke: () => Promise<void>) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  );
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
  const ev = new EventSource(`/api/replicache-poke-sse?spaceID=${spaceID}`, {
    withCredentials: true,
  });
  ev.onmessage = async (event) => {
    if (event.data === "poke") {
      await onPoke();
    }
  };
}
