export const supabaseConfig = getConfig();

function getConfig() {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY
  ) {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_KEY
    ) {
      throw new Error(
        "Invalid supabase config. both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY environment variables are required."
      );
    }

    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_KEY,
    };
  }
  return undefined;
}
