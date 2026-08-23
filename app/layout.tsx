import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tone — Color direction, beyond palettes",
  description: "Translate visual intent into coherent color, geometry, contrast, depth, typography and motion — then export it to code or AI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
