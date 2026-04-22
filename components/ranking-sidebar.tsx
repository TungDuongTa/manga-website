"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, TrendingUp, Flame, Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Manga } from '@/lib/manga-data'

interface RankingSidebarProps {
  manga: Manga[]
}

export function RankingSidebar({ manga }: RankingSidebarProps) {
  const [activeTab, setActiveTab] = useState('daily')

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const getMedalColor = (index: number) => {
    if (index === 0) return 'bg-chart-3 text-black'
    if (index === 1) return 'bg-gray-400 text-black'
    if (index === 2) return 'bg-chart-5 text-black'
    return 'bg-muted text-muted-foreground'
  }

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground text-lg">Rankings</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="daily" className="text-xs">
            <Flame className="h-3 w-3 mr-1" />
            Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Monthly
          </TabsTrigger>
        </TabsList>

        {['daily', 'weekly', 'monthly'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0 space-y-2">
            {manga.slice(0, 10).map((item, index) => (
              <Link 
                key={item.id} 
                href={`/manga/${item.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors group"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getMedalColor(index)}`}>
                  {index + 1}
                </div>
                <div className="relative w-10 h-14 rounded overflow-hidden shrink-0">
                  <Image
                    src={item.cover}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-chart-3 text-chart-3" />
                      {item.rating}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatViews(item.views)} views
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
