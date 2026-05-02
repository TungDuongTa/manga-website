import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

export const metadata: Metadata = {
  metadataBase: getBaseUrl(),
  title: {
    default: withSiteSuffix("Read Manga, Manhwa & Manhua Online"),
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  keywords: ["manga", "manhwa", "manhua", "read manga", "webtoon", "comics"],
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
    locale: "en_US",
    url: "/",
    siteName: SITE_NAME,
    title: withSiteSuffix("Read Manga, Manhwa & Manhua Online"),
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
    title: withSiteSuffix("Read Manga, Manhwa & Manhua Online"),
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
    <html lang="en" suppressHydrationWarning>
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
      </body>
    </html>
  );
}
