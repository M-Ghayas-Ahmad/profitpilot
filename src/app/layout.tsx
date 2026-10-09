import type { Metadata } from "next";
import { Manrope, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const display = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "ProfitPilot · Partner capital & spends",
  description:
    "Track partner commitments, money put into the pot, expenses from the pot, and cash left — built for small businesses and co-founders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
