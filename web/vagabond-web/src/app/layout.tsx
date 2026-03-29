import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "Vagabond",
  description: "Self-hosted trip planning for overlanders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
