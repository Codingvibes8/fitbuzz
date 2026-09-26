import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitBuzz | Training, in rhythm",
  description: "A clear, personal home for your training and progress.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
