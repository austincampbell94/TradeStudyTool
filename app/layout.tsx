import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade Study Tool — Interactive Evaluation Dashboard",
  description: "A modern Web Tool to evaluate alternative designs and configurations using pass/fail screening and weighted scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="glow-bg orb-1"></div>
        <div className="glow-bg orb-2"></div>
        {children}
      </body>
    </html>
  );
}
