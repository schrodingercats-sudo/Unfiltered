import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://unfiltered-parul.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "UNFILTERED — Anonymous Parul University Confessions",
    template: "%s | UNFILTERED",
  },
  description: "The anonymous confession board for Parul University students. Share your unfiltered thoughts, confessions, and opinions freely without judgment.",
  keywords: [
    "parul university", "anonymous", "confession", "campus",
    "college confessions", "unfiltered", "student community",
    "parul confession board", "anonymous posting", "PU confessions"
  ],
  authors: [{ name: "UNFILTERED" }],
  creator: "UNFILTERED",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "UNFILTERED",
    title: "UNFILTERED — Anonymous Parul University Confessions",
    description: "Share your unfiltered thoughts, confessions, and opinions freely. The anonymous student community board for Parul University.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "UNFILTERED — Speak Your Mind",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UNFILTERED — Anonymous Parul University Confessions",
    description: "Share your unfiltered thoughts freely. The anonymous student community board for Parul University.",
    images: [`${siteUrl}/og-image.png`],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  verification: {
    // Add your Google Search Console verification code here after setup
    // google: "your-verification-code",
  },
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
