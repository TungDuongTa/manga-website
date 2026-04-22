import { MangaCard } from './manga-card'
import type { Manga } from '@/lib/manga-data'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface MangaGridProps {
  title: string
  manga: Manga[]
  showViewAll?: boolean
  viewAllHref?: string
  columns?: 2 | 3 | 4 | 5 | 6
}

export function MangaGrid({ 
  title, 
  manga, 
  showViewAll = true, 
  viewAllHref = '/browse',
  columns = 6
}: MangaGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {showViewAll && (
          <Link 
            href={viewAllHref}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className={`grid ${gridCols[columns]} gap-4 md:gap-6`}>
        {manga.map((item) => (
          <MangaCard key={item.id} manga={item} />
        ))}
      </div>
    </section>
  )
}
