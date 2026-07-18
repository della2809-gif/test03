const publicEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function getSupabasePublicEnv() {
  if (!publicEnv.url || !publicEnv.anonKey) {
    throw new Error(
      "Supabase 환경 변수가 없습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.",
    );
  }
  return { url: publicEnv.url, anonKey: publicEnv.anonKey };
}

export function hasSupabasePublicEnv() {
  return Boolean(publicEnv.url && publicEnv.anonKey);
}
