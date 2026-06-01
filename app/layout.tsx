import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import ProgressBar from "@/components/ProgressBar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import {
  getBaseUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  withSiteSuffix,
} from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-Z65549N1TX";

export const metadata: Metadata = {
  metadataBase: getBaseUrl(),
  manifest: "/manifest.webmanifest",
  title: {
    default: withSiteSuffix(
      "VuaTruyen - Vua Truyện đọc manga, manhwa và manhua online",
    ),
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "vuatruyen",
    "vua truyen",
    "vua truyện",
    "VuaTruyen",
    "Vua Truyện",
    "manga",
    "manhwa",
    "manhua",
    "đọc manga",
    "đọc truyện tranh",
    "webtoon",
    "comics",
  ],
  verification: {
    google: "qfbcsA3mxPig7Cj39s4qhgBfPq1O-0RGXdiBiI-wC0A",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: SITE_NAME,
    title: withSiteSuffix(
      "VuaTruyen - Vua Truyện đọc manga, manhwa và manhua online",
    ),
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/body-bg.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} cover image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: withSiteSuffix(
      "VuaTruyen - Vua Truyện đọc manga, manhwa và manhua online",
    ),
    description: SITE_DESCRIPTION,
    images: ["/body-bg.jpg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? "",
      }
    : null;
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <main className="max-w-screen overflow-x-hidden">
            <ProgressBar />
            <Header user={user} />
            {children}
            <Toaster />
            <Footer />
          </main>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
