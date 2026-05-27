import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { SiteFooter, SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://capitoltrades.io"
  ),
  title: {
    default: "Capitol Trades — See What Congress Buys",
    template: "%s | Capitol Trades",
  },
  description:
    "Free tracker for every congressional stock trade. See today's pick, who's beating the S&P, and where lawmakers are converging — built for retail.",
  openGraph: {
    title: "Congress trades stocks. Now you can see every buy.",
    description:
      "Free STOCK Act dashboard: today's trade pick, crowd signals, and performance vs the S&P.",
    type: "website",
    siteName: "Capitol Trades",
  },
  twitter: {
    card: "summary_large_image",
    title: "See what Congress is buying — free",
    description:
      "Today's congressional trade pick + every disclosed buy/sell. Built for retail.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} h-full min-h-screen font-sans antialiased`}
      >
        <div className="relative flex min-h-screen w-full flex-col">
          <SiteHeader />
          <main className="min-w-0 flex-1 w-full">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
