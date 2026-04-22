"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OTruyenComic, getImageUrl, formatStatus } from "@/lib/otruyen-types";

interface HeroSectionApiProps {
  featuredComics: OTruyenComic[];
}

export function HeroSectionApi({ featuredComics }: HeroSectionApiProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featured = featuredComics.slice(0, 5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startAutoSlide = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 6000);
  };
  useEffect(() => {
    if (featured.length === 0) return;
    startAutoSlide();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [featured.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
    startAutoSlide();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featured.length);
    startAutoSlide();
  };

  if (featured.length === 0) {
    return (
      <section className="relative h-[520px] md:h-[620px] overflow-hidden rounded-2xl z-0 bg-card flex items-center justify-center">
        <p className="text-muted-foreground">Loading featured manga...</p>
      </section>
    );
  }

  const currentComic = featured[currentIndex];

  return (
    <section className="relative h-[520px] md:h-[620px] overflow-hidden rounded-2xl z-0 bg-background">
      {/* Right-side manga cover — animates in from right on slide change */}
      <div
        key={`img-${currentIndex}`}
        className="absolute inset-y-0 right-0 w-[55%] md:w-[48%] hero-slide-right"
      >
        <Image
          src={getImageUrl(currentComic.thumb_url)}
          alt={currentComic.name}
          fill
          className="object-cover object-top"
          priority
          unoptimized
        />
        {/* Mask: strong fade on the left, subtle fade on top/bottom edges */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/5" />
      </div>

      {/* Subtle dark tint over the entire section so left text is always legible */}
      <div className="absolute inset-0 bg-background/20 pointer-events-none" />

      {/* Left content — animates in from left on slide change */}
      <div className="relative h-full flex items-center z-10">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div
            key={`content-${currentIndex}`}
            className="max-w-lg hero-slide-left"
          >
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-primary text-primary-foreground">
                Featured
              </Badge>
              <Badge
                variant="outline"
                className="border-accent text-accent bg-background/50"
              >
                {formatStatus(currentComic.status)}
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 text-balance drop-shadow-lg leading-tight line-clamp-3">
              {currentComic.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              {currentComic.chaptersLatest?.[0] && (
                <span className="flex items-center gap-1 text-foreground/80">
                  <BookOpen className="h-5 w-5" />
                  <span>
                    Chapter {currentComic.chaptersLatest[0].chapter_name}
                  </span>
                </span>
              )}
              <Badge variant="secondary" className="bg-secondary/80">
                {formatStatus(currentComic.status)}
              </Badge>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {currentComic.category.slice(0, 4).map((cat) => (
                <Badge
                  key={cat.id}
                  variant="outline"
                  className="border-border/50 text-foreground/70 bg-background/40 backdrop-blur-sm"
                >
                  {cat.name}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/manga/${currentComic.slug}`}>
                <Button size="lg" className="gap-2 shadow-lg">
                  <Play className="h-4 w-4" />
                  Start Reading
                </Button>
              </Link>
              <Link href={`/manga/${currentComic.slug}`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                >
                  <BookOpen className="h-4 w-4" />
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation dots + arrows */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          className="h-9 w-9 rounded-full bg-background/60 hover:bg-background/90 backdrop-blur-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-2">
          {featured.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-primary w-8"
                  : "bg-foreground/30 w-2 hover:bg-foreground/50"
              }`}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="h-9 w-9 rounded-full bg-background/60 hover:bg-background/90 backdrop-blur-sm"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
