"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MangaCard } from '@/components/manga-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bookmark, Clock, CheckCircle, Trash2, Grid, List } from 'lucide-react'
import { featuredManga } from '@/lib/manga-data'

// Mock bookmarked data
const bookmarkedManga = featuredManga.slice(0, 6).map((manga, index) => ({
  ...manga,
  lastRead: `Chapter ${Math.floor(Math.random() * manga.chapters)}`,
  addedDate: `${index + 1} days ago`,
  progress: Math.floor(Math.random() * 100)
}))

const readingHistory = featuredManga.slice(3, 9).map((manga, index) => ({
  ...manga,
  lastRead: `Chapter ${Math.floor(Math.random() * manga.chapters)}`,
  readDate: index === 0 ? '2 hours ago' : `${index} days ago`
}))

const completedManga = featuredManga.filter(m => m.status === 'Completed').slice(0, 4)

export default function BookmarksPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const clearSelected = () => {
    setSelectedItems(new Set())
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bookmark className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">My Library</h1>
            </div>
            <p className="text-muted-foreground">Manage your bookmarks and reading history</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-md overflow-hidden">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'ghost'} 
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookmarks">
          <TabsList className="w-full justify-start bg-card border border-border rounded-xl p-1 h-auto flex-wrap mb-8">
            <TabsTrigger value="bookmarks" className="gap-2">
              <Bookmark className="h-4 w-4" />
              Bookmarks ({bookmarkedManga.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              History ({readingHistory.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed ({completedManga.length})
            </TabsTrigger>
          </TabsList>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks">
            {selectedItems.size > 0 && (
              <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4 mb-6">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearSelected}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {bookmarkedManga.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {bookmarkedManga.map((manga) => (
                    <div key={manga.id} className="relative">
                      <MangaCard manga={manga} />
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Last read: {manga.lastRead}</p>
                        <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${manga.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {bookmarkedManga.map((manga) => (
                    <div key={manga.id} className="flex items-center gap-4 bg-card border border-border rounded-xl p-4">
                      <MangaCard manga={manga} variant="horizontal" />
                      <div className="flex items-center gap-4 ml-auto">
                        <div className="text-right">
                          <p className="text-sm text-foreground">Progress: {manga.progress}%</p>
                          <p className="text-xs text-muted-foreground">Added {manga.addedDate}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No bookmarks yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start adding manga to your library to see them here
                </p>
                <Link href="/browse">
                  <Button>Browse Manga</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            {readingHistory.length > 0 ? (
              <div className="space-y-3">
                {readingHistory.map((manga) => (
                  <div key={manga.id} className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:bg-secondary/50 transition-colors">
                    <MangaCard manga={manga} variant="horizontal" />
                    <div className="ml-auto text-right">
                      <p className="text-sm text-foreground">{manga.lastRead}</p>
                      <p className="text-xs text-muted-foreground">{manga.readDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No reading history</h3>
                <p className="text-muted-foreground mb-4">
                  Your reading history will appear here
                </p>
                <Link href="/browse">
                  <Button>Start Reading</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed">
            {completedManga.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {completedManga.map((manga) => (
                  <div key={manga.id} className="relative">
                    <MangaCard manga={manga} />
                    <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Finished
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No completed manga</h3>
                <p className="text-muted-foreground mb-4">
                  Manga you finish reading will appear here
                </p>
                <Link href="/browse">
                  <Button>Find Manga</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}
