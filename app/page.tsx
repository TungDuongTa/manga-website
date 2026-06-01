import type { Metadata } from "next";
import { HeroSectionApi } from "@/components/hero-section-api";
import { RankingSidebarApi } from "@/components/ranking-sidebar-api";
import { CommentsSection } from "@/components/comments-section";
import { MangaCardApi } from "@/components/manga-card-api";
import { getHomeData, getListByType } from "@/lib/actions/otruyen-actions";
import { getRecentTopLevelComments } from "@/lib/actions/comment.actions";
import { getMangaRankings } from "@/lib/actions/manga-view.actions";
import {
  SITE_ALTERNATE_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  toAbsoluteUrl,
} from "@/lib/seo";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title:
    "VuaTruyen - Vua Truyện đọc manga, manhwa và manhua online",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  // Fetch data in parallel
  const [
    homeData,
    latestData,
    completedData,
    ongoingData,
    recentComments,
    rankings,
  ] = await Promise.all([
    getHomeData(),
    getListByType("truyen-moi", 1),
    getListByType("hoan-thanh", 1),
    getListByType("dang-phat-hanh", 1),
    getRecentTopLevelComments(10),
    getMangaRankings(10),
  ]);

  const featuredComics = homeData?.items || [];
  const latestComics = latestData?.items || [];
  const completedComics = completedData?.items || [];
  const ongoingComics = ongoingData?.items || [];

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: [
      "VuaTruyen",
      "vuatruyen",
      SITE_ALTERNATE_NAME,
      "Vua Truyen",
      "Vua truyện",
      "vua truyen",
      "Vua truyen",
      "Vua Truyện",
      "vua truyện",
    ],
    url: toAbsoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${toAbsoluteUrl("/browse")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <HeroSectionApi featuredComics={featuredComics} />
        </section>

        {/* Latest Updates Grid Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Mới cập nhật</h2>
            <Link
              href="/latest"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Xem tất cả <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {latestComics.slice(0, 12).map((comic) => (
              <MangaCardApi key={comic._id} comic={comic} />
            ))}
          </div>
        </section>

        {/* Popular This Week Grid Section */}
        {/* <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Popular This Week
            </h2>
            <Link
              href="/browse?sort=popular"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {featuredComics.slice(0, 6).map((comic) => (
              <MangaCardApi key={comic._id} comic={comic} />
            ))}
          </div>
        </section> */}

        {/* Main Content with Sidebar Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Side - Manga List */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Truyện đề cử
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {ongoingComics.slice(0, 24).map((comic) => (
                <MangaCardApi key={comic._id} comic={comic} />
              ))}
            </div>
          </div>

          {/* Right Side - Rankings & Comments */}
          <div className="space-y-6">
            <RankingSidebarApi initialRankings={rankings} />
            <CommentsSection comments={recentComments} />
          </div>
        </section>

        {/* Completed Manga Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Truyện đã hoàn thành
            </h2>
            <Link
              href="/browse?status=completed"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Xem tất cả
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3">
            {completedComics.slice(0, 6).map((comic) => (
              <MangaCardApi
                key={comic._id}
                comic={comic}
                variant="horizontal"
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
