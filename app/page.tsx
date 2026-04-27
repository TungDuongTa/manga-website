import { HeroSectionApi } from "@/components/hero-section-api";
import { RankingSidebarApi } from "@/components/ranking-sidebar-api";
import { CommentsSection } from "@/components/comments-section";
import { MangaCardApi } from "@/components/manga-card-api";
import { getHomeData, getListByType } from "@/lib/actions/otruyen-actions";
import { recentComments } from "@/lib/manga-data";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function HomePage() {
  // Fetch data in parallel
  const [homeData, latestData, completedData] = await Promise.all([
    getHomeData(),
    getListByType("truyen-moi", 1),
    getListByType("hoan-thanh", 1),
  ]);

  const featuredComics = homeData?.items || [];
  const latestComics = latestData?.items || [];
  const completedComics = completedData?.items || [];

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <HeroSectionApi featuredComics={featuredComics} />
        </section>

        {/* Latest Updates Grid Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Latest Updates
            </h2>
            <Link
              href="/latest"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {latestComics.slice(0, 12).map((comic) => (
              <MangaCardApi key={comic._id} comic={comic} />
            ))}
          </div>
        </section>

        {/* Popular This Week Grid Section */}
        <section className="mb-12">
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
        </section>

        {/* Main Content with Sidebar Section */}
        <section className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left Side - Manga List */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Recommended For You
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {latestComics.slice(0, 8).map((comic) => (
                <MangaCardApi key={comic._id} comic={comic} />
              ))}
            </div>
          </div>

          {/* Right Side - Rankings & Comments */}
          <div className="space-y-6">
            <RankingSidebarApi />
            <CommentsSection comments={recentComments} compact />
          </div>
        </section>

        {/* Completed Manga Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Completed Series
            </h2>
            <Link
              href="/browse?status=completed"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View All <ChevronRight className="h-4 w-4" />
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
