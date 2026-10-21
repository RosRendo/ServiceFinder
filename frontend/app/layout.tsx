import type { Metadata } from "next";
import { Inter, Outfit, Suwannaphum } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const suwannaphum = Suwannaphum({
  variable: "--font-suwannaphum",
  weight: ["100", "300", "400", "700", "900"],
  subsets: ["khmer"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: "ServiceFinder Business — Manage Your Service Company",
    template: "%s | ServiceFinder Business",
  },
  description:
    "The modern OS for service businesses. Everything you need to run your company, manage staff, handle bookings, and process payments.",
  keywords: [
    "service management", "booking software", "staff dispatching", "service business software",
    "b2b saas", "service platform",
  ],
  authors: [{ name: "ServiceFinder" }],
  creator: "ServiceFinder",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "ServiceFinder Business",
    title: "ServiceFinder Business — Manage Your Service Company",
    description:
      "The modern OS for service businesses. Everything you need to run your company, manage staff, handle bookings, and process payments.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ServiceFinder Business Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ServiceFinder Business — Manage Your Service Company",
    description:
      "The modern OS for service businesses.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo-mark.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/logo-mark.svg" },
    ],
  },
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
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sparkle-find.vercel.app'}/#website`,
      "url": process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sparkle-find.vercel.app',
      "name": "SparkleFind",
      "description": "Discover, compare, and book trusted local service professionals near you.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sparkle-find.vercel.app'}/explore?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sparkle-find.vercel.app'}/#organization`,
      "name": "SparkleFind",
      "url": process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sparkle-find.vercel.app',
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sparkle-find.vercel.app'}/og-image.png`,
      },
      "sameAs": [],
    },
  ],
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { CookieConsent } from "@/components/common/CookieConsent";
import { PHProvider } from "./providers";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} ${suwannaphum.variable} antialiased font-sans bg-background text-foreground`}
      >
        <PHProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <CookieConsent />
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </PHProvider>
      </body>
    </html>
  );
}
