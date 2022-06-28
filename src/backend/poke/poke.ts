import { Executor } from "../pg";
import { getSupabaseServerConfig } from "../supabase";
import { SSEPokeBackend } from "./sse";
import { SupabasePokeBackend } from "./supabase";

export interface PokeBackend {
  initSchema(executor: Executor): Promise<void>;
  poke(spaceID: string): void;
}

export function getPokeBackend() {
  // The SSE impl has to keep process-wide state using the global object.
  // Otherwise the state is lost during hot reload in dev.
  const global = (globalThis as unknown) as {
    _pokeBackend: PokeBackend | undefined;
  };
  if (!global._pokeBackend) {
    global._pokeBackend = initPokeBackend();
  }
  return global._pokeBackend;
}

function initPokeBackend() {
  const supabaseServerConfig = getSupabaseServerConfig();
  if (supabaseServerConfig) {
    console.log("Creating SupabasePokeBackend");
    return new SupabasePokeBackend();
  } else {
    console.log("Creating SSEPokeBackend");
    return new SSEPokeBackend();
  }
}
