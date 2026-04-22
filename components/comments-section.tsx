"use client"

import { useState } from 'react'
import Image from 'next/image'
import { MessageCircle, ThumbsUp, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Comment } from '@/lib/manga-data'

interface CommentsSectionProps {
  comments: Comment[]
  compact?: boolean
}

export function CommentsSection({ comments, compact = false }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  const toggleLike = (commentId: string) => {
    setLikedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground text-lg">Recent Comments</h3>
      </div>

      {!compact && (
        <div className="mb-4">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-secondary border-none resize-none mb-2"
            rows={2}
          />
          <Button size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            Post Comment
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {comments.slice(0, compact ? 5 : 10).map((comment) => (
          <div 
            key={comment.id} 
            className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                <Image
                  src={comment.avatar}
                  alt={comment.user}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-foreground">{comment.user}</span>
                  <span className="text-xs text-muted-foreground">{comment.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {comment.content}
                </p>
                <button
                  onClick={() => toggleLike(comment.id)}
                  className={`flex items-center gap-1 mt-2 text-xs transition-colors ${
                    likedComments.has(comment.id) 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ThumbsUp className={`h-3 w-3 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                  <span>{comment.likes + (likedComments.has(comment.id) ? 1 : 0)}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {compact && (
        <Button variant="ghost" className="w-full mt-4 text-primary">
          View All Comments
        </Button>
      )}
    </div>
  )
}
