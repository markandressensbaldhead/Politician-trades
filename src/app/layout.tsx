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
  title: {
    default: "Capitol Trades | Congressional Stock Tracker",
    template: "%s | Capitol Trades",
  },
  description:
    "Track congressional stock trades, compare returns to the market, and read plain-English summaries of public filings.",
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
