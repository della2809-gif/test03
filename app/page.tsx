import type { Metadata } from "next";
import { HealthCoachingApp } from "./health-coaching-app";

export const metadata: Metadata = {
  title: "건강자산 | 프리미엄 건강 코칭",
  description: "문진과 현장 측정 데이터를 연결해 관리 우선순위를 찾는 프리미엄 건강 코칭 워크스페이스",
};

export default function Home() {
  return <HealthCoachingApp />;
}
