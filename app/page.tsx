import type { Metadata } from "next";
import { PlatformApp } from "./platform-app";

export const metadata: Metadata = {
  title: "건강자산 | 건강도 나의 소중한 자산입니다",
  description: "5분 무료 AI 건강체크부터 건강통장, 30일 미션, 인바디 기반 VIP 대면 코칭까지 이어지는 건강자산관리 플랫폼",
};

export default function Home() {
  return <PlatformApp />;
}
