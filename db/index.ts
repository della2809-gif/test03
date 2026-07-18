export function getDb() {
  throw new Error(
    "데이터베이스가 아직 연결되지 않았습니다. 운영 저장 기능을 활성화할 때 Supabase 또는 D1 어댑터를 구성하세요.",
  );
}
