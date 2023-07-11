const clientEnvVars = {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};
const serverEnvVars = {
  ...clientEnvVars,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  dbpass: process.env.SUPABASE_DATABASE_PASSWORD!,
};

export type SupabaseClientConfig = typeof clientEnvVars;
export type SupabaseServerConfig = typeof serverEnvVars;

export function getSupabaseClientConfig() {
  return validate(clientEnvVars);
}

export function getSupabaseServerConfig() {
  return validate(serverEnvVars);
}

function validate<T extends Record<string, string>>(vars: T) {
  for (const [k, v] of Object.entries(vars)) {
    if (!v) {
      throw new Error(`Required env var '${k}' was not set`);
    }
  }
  return vars;
}
