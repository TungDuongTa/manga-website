import type { Metadata } from "next";
import { withSiteSuffix } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Browse Manga",
  description:
    "Search and filter manga, manhwa, and manhua by genre and status.",
  alternates: {
    canonical: "/browse",
  },
  openGraph: {
    title: withSiteSuffix("Browse Manga"),
    description:
      "Search and filter manga, manhwa, and manhua by genre and status.",
    url: "/browse",
  },
  twitter: {
    title: withSiteSuffix("Browse Manga"),
    description:
      "Search and filter manga, manhwa, and manhua by genre and status.",
  },
};

export default function BrowseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
