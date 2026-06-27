import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "BULLRUN",
  description: "Season One crypto racing league dashboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
