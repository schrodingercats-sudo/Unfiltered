import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "UNFILTERED",
  description: "The anonymous Parul University comment board. Speak your mind freely.",
  keywords: ["anonymous", "parul university", "confession", "campus", "college"],
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://zitrcqplierpbdgmcjek.supabase.co" />
        <link rel="preconnect" href="https://zitrcqplierpbdgmcjek.supabase.co" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={outfit.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
