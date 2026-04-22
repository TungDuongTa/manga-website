import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MangaCardApi } from '@/components/manga-card-api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getListByType } from '@/lib/otruyen-actions'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function LatestPage({ searchParams }: PageProps) {
  const { page } = await searchParams
  const currentPage = parseInt(page || '1')
  
  const data = await getListByType('truyen-moi', currentPage)
  const comics = data?.items || []
  const pagination = data?.params.pagination
  const totalPages = pagination ? Math.ceil(pagination.totalItems / pagination.totalItemsPerPage) : 1

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Latest Updates</h1>
          </div>
          <p className="text-muted-foreground">
            The newest manga chapters, updated daily
          </p>
        </div>

        {/* Results Count */}
        {pagination && (
          <div className="flex items-center gap-3 mb-6">
            <Badge className="bg-accent text-accent-foreground">
              {pagination.totalItems} total
            </Badge>
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}

        {/* Manga Grid */}
        {comics.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {comics.map((comic) => (
              <MangaCardApi key={comic._id} comic={comic} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No manga found</h3>
            <p className="text-muted-foreground">Check back later for updates</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {currentPage > 1 ? (
              <Link href={`/latest?page=${currentPage - 1}`}>
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="icon" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Link key={pageNum} href={`/latest?page=${pageNum}`}>
                    <Button
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="icon"
                    >
                      {pageNum}
                    </Button>
                  </Link>
                )
              })}
            </div>
            
            {currentPage < totalPages ? (
              <Link href={`/latest?page=${currentPage + 1}`}>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="icon" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Horizontal List View */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-foreground mb-6">Recent Activity</h2>
          <div className="space-y-3">
            {comics.slice(0, 10).map((comic) => (
              <MangaCardApi key={comic._id} comic={comic} variant="horizontal" />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
