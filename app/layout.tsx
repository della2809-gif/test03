import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://della2809-gif.github.io/test03";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "건강자산", template: "%s | 건강자산" },
  description: "건강을 기록하고, 건강을 쌓는 AI 기반 건강자산관리 플랫폼",
  openGraph: { title: "건강자산", description: "건강도 관리하면 복리가 됩니다.", images: [`${siteUrl}/og.png`], locale: "ko_KR", type: "website" },
  twitter: { card: "summary_large_image", title: "건강자산", description: "건강도 관리하면 복리가 됩니다.", images: [`${siteUrl}/og.png`] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
