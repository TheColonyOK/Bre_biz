import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Breanna Events & Bar | A little magic. A lot of intention.",
  description: "Explore an interactive event planning and mobile bartending concept, with booking, a personal event planner and an owner studio.",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
