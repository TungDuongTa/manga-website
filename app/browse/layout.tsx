import type { Metadata } from "next";
import { withSiteSuffix } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Khám phá",
  description:
    "Tìm kiếm những bộ truyện tranh manga, manhwa và manhua mới nhất tại VuaTruyen",
  alternates: {
    canonical: "/browse",
  },
  openGraph: {
    title: withSiteSuffix("Khám phá"),
    description:
      "Tìm kiếm những bộ truyện tranh manga, manhwa và manhua mới nhất tại VuaTruyen",
    url: "/browse",
  },
  twitter: {
    title: withSiteSuffix("Khám phá"),
    description:
      "Tìm kiếm những bộ truyện tranh manga, manhwa và manhua mới nhất tại VuaTruyen",
  },
};

export default function BrowseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
