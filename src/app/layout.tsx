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
    "Track congressional stock trades and portfolio performance from public financial disclosures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen font-sans antialiased`}
      >
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
