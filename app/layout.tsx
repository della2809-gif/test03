import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  return {
    title: { default: "건강자산", template: "%s | 건강자산" },
    description: "나의 몸을 더 깊이 이해하는 프리미엄 건강 코칭",
    openGraph: { title: "건강자산", description: "프리미엄 건강 코칭", images: [image], locale: "ko_KR", type: "website" },
    twitter: { card: "summary_large_image", title: "건강자산", description: "프리미엄 건강 코칭", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
