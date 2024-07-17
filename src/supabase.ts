export function getProjectURL() {
  return getEnvVar(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  );
}

export function getAPIKey() {
  return getEnvVar(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export function getConnectionString() {
  return getEnvVar(process.env.SUPABASE_DATABASE_URL, "SUPABASE_DATABASE_URL");
}

function getEnvVar(v: string | undefined, n: string) {
  if (!v) {
    throw new Error(`Required env var '${n}' was not set`);
  }
  return v;
}
