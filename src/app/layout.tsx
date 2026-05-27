import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { DeprecationBanner } from "@/components/layout/deprecation-banner";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { BRAND, COPY } from "@/lib/brand";
import { DEPRECATION, isSiteDeprecated } from "@/lib/site-status";

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
  metadataBase: new URL(BRAND.url),
  title: {
    default: isSiteDeprecated()
      ? DEPRECATION.title
      : `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: isSiteDeprecated()
    ? DEPRECATION.message
    : "Track every disclosed trade on the Hill. Today's pick, crowd signals, vs-S&P performance — built for retail on Trade the Hill.",
  robots: isSiteDeprecated()
    ? { index: false, follow: false }
    : undefined,
  openGraph: {
    title: isSiteDeprecated()
      ? DEPRECATION.title
      : "Trade the Hill — see every congressional buy.",
    description: isSiteDeprecated()
      ? DEPRECATION.message
      : "Free STOCK Act feed: today's Hill pick, crowd signals, and performance vs the S&P.",
    type: "website",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description:
      `Today's ${COPY.hillPick} + every disclosed buy and sell on ${BRAND.hill}. Built for retail.`,
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
          {isSiteDeprecated() && <DeprecationBanner />}
          <SiteHeader deprecated={isSiteDeprecated()} />
          <main className="min-w-0 flex-1 w-full">{children}</main>
          <SiteFooter deprecated={isSiteDeprecated()} />
        </div>
      </body>
    </html>
  );
}
