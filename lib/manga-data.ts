export interface Manga {
  id: string
  title: string
  cover: string
  rating: number
  chapters: number
  latestChapter: string
  status: 'Ongoing' | 'Completed' | 'Hiatus'
  type: 'Manga' | 'Manhwa' | 'Manhua'
  genres: string[]
  description: string
  author: string
  artist: string
  views: number
  lastUpdated: string
}

export interface Chapter {
  id: string
  number: number
  title: string
  date: string
  pages: number
}

export interface Comment {
  id: string
  user: string
  avatar: string
  content: string
  time: string
  likes: number
}

export const featuredManga: Manga[] = [
  {
    id: 'solo-leveling',
    title: 'Solo Leveling',
    cover: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300&h=400&fit=crop',
    rating: 4.9,
    chapters: 179,
    latestChapter: 'Chapter 179',
    status: 'Completed',
    type: 'Manhwa',
    genres: ['Action', 'Fantasy', 'Adventure'],
    description: 'In a world where hunters must battle deadly monsters to protect humanity, Sung Jin-Woo starts as the weakest hunter.',
    author: 'Chugong',
    artist: 'DUBU',
    views: 15420000,
    lastUpdated: '2 hours ago'
  },
  {
    id: 'tower-of-god',
    title: 'Tower of God',
    cover: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=300&h=400&fit=crop',
    rating: 4.8,
    chapters: 580,
    latestChapter: 'Chapter 580',
    status: 'Ongoing',
    type: 'Manhwa',
    genres: ['Action', 'Fantasy', 'Mystery'],
    description: 'What do you desire? Money? Power? Fame? Revenge? Or something that transcends all of them?',
    author: 'SIU',
    artist: 'SIU',
    views: 12300000,
    lastUpdated: '5 hours ago'
  },
  {
    id: 'one-piece',
    title: 'One Piece',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=400&fit=crop',
    rating: 4.9,
    chapters: 1108,
    latestChapter: 'Chapter 1108',
    status: 'Ongoing',
    type: 'Manga',
    genres: ['Action', 'Adventure', 'Comedy'],
    description: 'Monkey D. Luffy sets off on a journey to find One Piece and become the King of Pirates!',
    author: 'Eiichiro Oda',
    artist: 'Eiichiro Oda',
    views: 25600000,
    lastUpdated: '1 day ago'
  },
  {
    id: 'the-beginning-after-the-end',
    title: 'The Beginning After The End',
    cover: 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=300&h=400&fit=crop',
    rating: 4.8,
    chapters: 195,
    latestChapter: 'Chapter 195',
    status: 'Ongoing',
    type: 'Manhwa',
    genres: ['Action', 'Fantasy', 'Isekai'],
    description: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability.',
    author: 'TurtleMe',
    artist: 'Fuyuki23',
    views: 9800000,
    lastUpdated: '3 hours ago'
  },
  {
    id: 'martial-peak',
    title: 'Martial Peak',
    cover: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=300&h=400&fit=crop',
    rating: 4.6,
    chapters: 3200,
    latestChapter: 'Chapter 3200',
    status: 'Ongoing',
    type: 'Manhua',
    genres: ['Action', 'Martial Arts', 'Fantasy'],
    description: 'The journey to the martial peak is a lonely, solitary and long one.',
    author: 'Momo',
    artist: 'Pikapi',
    views: 8500000,
    lastUpdated: '1 hour ago'
  },
  {
    id: 'jujutsu-kaisen',
    title: 'Jujutsu Kaisen',
    cover: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&h=400&fit=crop',
    rating: 4.9,
    chapters: 253,
    latestChapter: 'Chapter 253',
    status: 'Ongoing',
    type: 'Manga',
    genres: ['Action', 'Supernatural', 'School'],
    description: 'Yuji Itadori joins a secret organization of Jujutsu Sorcerers to kill a powerful Curse.',
    author: 'Gege Akutami',
    artist: 'Gege Akutami',
    views: 18900000,
    lastUpdated: '4 hours ago'
  },
  {
    id: 'omniscient-reader',
    title: 'Omniscient Reader',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
    rating: 4.9,
    chapters: 178,
    latestChapter: 'Chapter 178',
    status: 'Ongoing',
    type: 'Manhwa',
    genres: ['Action', 'Fantasy', 'Apocalypse'],
    description: 'The world has become the novel I read. Only I know the ending of this world.',
    author: 'Sing Shong',
    artist: 'Sleepy-C',
    views: 11200000,
    lastUpdated: '6 hours ago'
  },
  {
    id: 'demon-slayer',
    title: 'Demon Slayer',
    cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop',
    rating: 4.8,
    chapters: 205,
    latestChapter: 'Chapter 205',
    status: 'Completed',
    type: 'Manga',
    genres: ['Action', 'Supernatural', 'Historical'],
    description: 'Tanjiro Kamado embarks on a quest to become a Demon Slayer and cure his sister.',
    author: 'Koyoharu Gotouge',
    artist: 'Koyoharu Gotouge',
    views: 22100000,
    lastUpdated: '3 days ago'
  },
  {
    id: 'return-of-mount-hua',
    title: 'Return of Mount Hua Sect',
    cover: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=300&h=400&fit=crop',
    rating: 4.7,
    chapters: 120,
    latestChapter: 'Chapter 120',
    status: 'Ongoing',
    type: 'Manhwa',
    genres: ['Action', 'Martial Arts', 'Comedy'],
    description: 'The 13th disciple of the Mount Hua Sect returns to restore its former glory.',
    author: 'Biga',
    artist: 'LICO',
    views: 7600000,
    lastUpdated: '8 hours ago'
  },
  {
    id: 'eleceed',
    title: 'Eleceed',
    cover: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=300&h=400&fit=crop',
    rating: 4.8,
    chapters: 290,
    latestChapter: 'Chapter 290',
    status: 'Ongoing',
    type: 'Manhwa',
    genres: ['Action', 'Comedy', 'Supernatural'],
    description: 'Jiwoo is a kind-hearted young man with superpowers who rescues animals in trouble.',
    author: 'Son Je-Ho',
    artist: 'ZHENA',
    views: 8900000,
    lastUpdated: '2 days ago'
  },
  {
    id: 'chainsaw-man',
    title: 'Chainsaw Man',
    cover: 'https://images.unsplash.com/photo-1615680022647-99c397cbcaea?w=300&h=400&fit=crop',
    rating: 4.9,
    chapters: 165,
    latestChapter: 'Chapter 165',
    status: 'Ongoing',
    type: 'Manga',
    genres: ['Action', 'Horror', 'Supernatural'],
    description: 'Denji becomes a Devil Hunter to pay off his deceased fathers debt.',
    author: 'Tatsuki Fujimoto',
    artist: 'Tatsuki Fujimoto',
    views: 16700000,
    lastUpdated: '5 hours ago'
  },
  {
    id: 'spy-x-family',
    title: 'Spy x Family',
    cover: 'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=300&h=400&fit=crop',
    rating: 4.8,
    chapters: 97,
    latestChapter: 'Chapter 97',
    status: 'Ongoing',
    type: 'Manga',
    genres: ['Action', 'Comedy', 'Slice of Life'],
    description: 'A spy must build a fake family for his mission, but his wife is an assassin and his daughter is a telepath.',
    author: 'Tatsuya Endo',
    artist: 'Tatsuya Endo',
    views: 14300000,
    lastUpdated: '1 week ago'
  }
]

export const latestUpdates: Manga[] = featuredManga.slice(0, 8)

export const popularManga: Manga[] = [...featuredManga].sort((a, b) => b.views - a.views).slice(0, 10)

export const recentComments: Comment[] = [
  {
    id: '1',
    user: 'MangaFan99',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MangaFan99',
    content: 'This chapter was absolutely insane! The art quality keeps getting better.',
    time: '5 minutes ago',
    likes: 24
  },
  {
    id: '2',
    user: 'WebtoonLover',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WebtoonLover',
    content: 'Finally caught up with the latest chapter. Worth the wait!',
    time: '12 minutes ago',
    likes: 18
  },
  {
    id: '3',
    user: 'OtakuKing',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OtakuKing',
    content: 'The plot twist at the end got me! Cant wait for next week.',
    time: '25 minutes ago',
    likes: 42
  },
  {
    id: '4',
    user: 'ReadingQueen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ReadingQueen',
    content: 'The character development in this series is top tier.',
    time: '1 hour ago',
    likes: 31
  },
  {
    id: '5',
    user: 'ActionFanatic',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ActionFanatic',
    content: 'Those fight scenes were drawn so well. 10/10 chapter!',
    time: '2 hours ago',
    likes: 56
  }
]

export const genres = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
  'Horror', 'Isekai', 'Martial Arts', 'Mystery', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
]

export const sampleChapters: Chapter[] = Array.from({ length: 20 }, (_, i) => ({
  id: `ch-${179 - i}`,
  number: 179 - i,
  title: `Chapter ${179 - i}`,
  date: i === 0 ? '2 hours ago' : i < 3 ? `${i + 1} days ago` : `${i + 3} days ago`,
  pages: Math.floor(Math.random() * 20) + 15
}))
