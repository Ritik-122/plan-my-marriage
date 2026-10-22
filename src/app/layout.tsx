import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plan My Marriage",
  description: "A shared place to plan your wedding.",
  icons: {
    icon: { url: "/landing/logo.svg", type: "image/svg+xml", sizes: "any" },
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
