import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import ProgressBar from "@/components/ProgressBar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VuaTruyen - Read Manga, Manhwa & Manhua Online",
  description:
    "Your ultimate destination for reading manga, manhwa, and manhua. Discover thousands of titles with daily updates.",
  keywords: ["manga", "manhwa", "manhua", "read manga", "webtoon", "comics"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ProgressBar />
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
