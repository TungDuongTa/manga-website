"use client"

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MangaCardApi } from '@/components/manga-card-api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  Heart, 
  Share2, 
  Clock, 
  User, 
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Play,
  Loader2
} from 'lucide-react'
import { getComicDetail, getHomeData } from '@/lib/otruyen-actions'
import { ComicDetailItem, OTruyenComic, getImageUrl, formatStatus, formatUpdatedAt } from '@/lib/otruyen-types'

export default function MangaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [comic, setComic] = useState<ComicDetailItem | null>(null)
  const [relatedComics, setRelatedComics] = useState<OTruyenComic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [chaptersOrder, setChaptersOrder] = useState<'desc' | 'asc'>('desc')
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [detailData, homeData] = await Promise.all([
          getComicDetail(id),
          getHomeData()
        ])
        
        if (detailData) {
          setComic(detailData.item)
        }
        
        if (homeData) {
          // Filter related comics by category
          const related = homeData.items
            .filter(c => c.slug !== id)
            .slice(0, 6)
          setRelatedComics(related)
        }
      } catch (error) {
        console.error('Failed to fetch comic:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!comic) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold text-foreground mb-4">Manga Not Found</h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const chapters = comic.chapters?.[0]?.server_data || []
  const sortedChapters = [...chapters].sort((a, b) => {
    const aNum = parseFloat(a.chapter_name) || 0
    const bNum = parseFloat(b.chapter_name) || 0
    return chaptersOrder === 'desc' ? bNum - aNum : aNum - bNum
  })

  const firstChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null
  const latestChapter = chapters.length > 0 ? chapters[0] : null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Banner */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <Image
            src={getImageUrl(comic.thumb_url)}
            alt={comic.name}
            fill
            className="object-cover blur-sm scale-110"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-4 -mt-40 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover Image */}
            <div className="shrink-0">
              <div className="relative w-48 md:w-56 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl shadow-primary/20 mx-auto md:mx-0 bg-muted">
                <Image
                  src={getImageUrl(comic.thumb_url)}
                  alt={comic.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* Manga Info */}
            <div className="flex-1 pt-4 md:pt-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-primary text-primary-foreground">
                  {formatStatus(comic.status)}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">
                {comic.name}
              </h1>

              {comic.origin_name.length > 0 && (
                <p className="text-muted-foreground mb-4">
                  {comic.origin_name.join(', ')}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-5 w-5" />
                  <span>{chapters.length} chapters</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span>{formatUpdatedAt(comic.updatedAt)}</span>
                </span>
              </div>

              {/* Author */}
              {comic.author.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Author: <span className="text-foreground font-medium">{comic.author.join(', ')}</span></span>
                  </div>
                </div>
              )}

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-6">
                {comic.category.map((cat) => (
                  <Link key={cat.id} href={`/browse?genre=${cat.slug}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      {cat.name}
                    </Badge>
                  </Link>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {firstChapter && (
                  <Link href={`/manga/${comic.slug}/chapter/${firstChapter.chapter_name}`}>
                    <Button size="lg" className="gap-2">
                      <Play className="h-4 w-4" />
                      Start Reading
                    </Button>
                  </Link>
                )}
                {latestChapter && (
                  <Link href={`/manga/${comic.slug}/chapter/${latestChapter.chapter_name}`}>
                    <Button size="lg" variant="outline" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Latest Chapter
                    </Button>
                  </Link>
                )}
                <Button 
                  size="lg" 
                  variant={isBookmarked ? 'default' : 'outline'}
                  className="gap-2"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                >
                  <Heart className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
                <Button size="lg" variant="ghost" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8 bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Synopsis</h2>
            <div 
              className={`text-muted-foreground leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}
              dangerouslySetInnerHTML={{ __html: comic.content || 'No description available.' }}
            />
            {comic.content && comic.content.length > 200 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-primary"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {isDescriptionExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Read More
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Tabs: Chapters */}
          <div className="mt-8">
            <Tabs defaultValue="chapters">
              <TabsList className="w-full justify-start bg-card border border-border rounded-xl p-1 h-auto flex-wrap">
                <TabsTrigger value="chapters" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Chapters ({chapters.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chapters" className="mt-6">
                {/* Chapter List Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Chapter List</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                    onClick={() => setChaptersOrder(chaptersOrder === 'desc' ? 'asc' : 'desc')}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {chaptersOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                  </Button>
                </div>

                {/* Chapter List */}
                <div className="bg-card border border-border rounded-xl divide-y divide-border max-h-[500px] overflow-y-auto">
                  {sortedChapters.map((chapter, index) => (
                    <Link
                      key={`${chapter.chapter_name}-${index}`}
                      href={`/manga/${comic.slug}/chapter/${chapter.chapter_name}`}
                      className="flex items-center justify-between p-4 hover:bg-secondary transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-foreground">
                          Chapter {chapter.chapter_name}
                        </span>
                        {chapter.chapter_title && (
                          <span className="text-muted-foreground text-sm hidden sm:inline">
                            {chapter.chapter_title}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Related Manga */}
          {relatedComics.length > 0 && (
            <section className="mt-12 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">You May Also Like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {relatedComics.map((c) => (
                  <MangaCardApi key={c._id} comic={c} showLatestChapter={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
