import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://della2809-gif.github.io/test03";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "건강자산", template: "%s | 건강자산" },
  description: "나의 몸을 더 깊이 이해하는 프리미엄 건강 코칭",
  openGraph: { title: "건강자산", description: "프리미엄 건강 코칭", images: [`${siteUrl}/og.png`], locale: "ko_KR", type: "website" },
  twitter: { card: "summary_large_image", title: "건강자산", description: "프리미엄 건강 코칭", images: [`${siteUrl}/og.png`] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
