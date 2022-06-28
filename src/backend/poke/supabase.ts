import { Executor } from "../pg";
import { PokeBackend } from "./poke";

// Implements the poke backend using Supabase's realtime features.
export class SupabasePokeBackend implements PokeBackend {
  async initSchema(executor: Executor): Promise<void> {
    await executor(`alter publication supabase_realtime add table space`);
    await executor(`alter publication supabase_realtime set
        (publish = 'insert, update, delete');`);
  }

  poke() {
    // No need to poke, this is handled internally by the supabase realtime stuff.
  }
}
