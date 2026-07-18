import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env.ts";

export function createWellsetBrowserClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
