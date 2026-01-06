'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, MessageCircle, Share2, Car } from 'lucide-react'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import { PostWithAuthor } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface PostCardProps {
  post: PostWithAuthor
}

const categoryColors: Record<string, string> = {
  maintenance: 'bg-blue-500/20 text-blue-400',
  modification: 'bg-purple-500/20 text-purple-400',
  journey: 'bg-green-500/20 text-green-400',
  review: 'bg-yellow-500/20 text-yellow-400',
  other: 'bg-zinc-500/20 text-zinc-400',
}

const categoryLabels: Record<string, string> = {
  maintenance: 'Maintenance',
  modification: 'Modification',
  journey: 'Journey',
  review: 'Review',
  other: 'Other',
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/u/${post.author.username}`}>
            <Avatar
              src={post.author.avatar}
              alt={post.author.name || post.author.username}
              size="md"
            />
          </Link>
          <div>
            <Link
              href={`/u/${post.author.username}`}
              className="font-medium text-white hover:text-orange-400 transition-colors"
            >
              {post.author.name || post.author.username}
            </Link>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span>@{post.author.username}</span>
              <span>·</span>
              <span>{formatDistanceToNow(post.createdAt, { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[post.category]}`}>
          {categoryLabels[post.category]}
        </span>
      </div>

      {/* Car Badge */}
      {post.car && (
        <Link
          href={`/car/${post.car.id}`}
          className="mx-4 mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-full text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <Car className="w-4 h-4 text-orange-500" />
          <span>
            {post.car.nickname || `${post.car.year} ${post.car.make} ${post.car.model}`}
          </span>
        </Link>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <Link href={`/post/${post.id}`}>
          <h2 className="text-lg font-semibold text-white hover:text-orange-400 transition-colors mb-2">
            {post.title}
          </h2>
        </Link>
        <p className="text-zinc-400 line-clamp-3">{post.content}</p>
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className="relative aspect-video mx-4 mb-4 rounded-lg overflow-hidden">
          <Image
            src={post.images[0]}
            alt={post.title}
            fill
            className="object-cover"
          />
          {post.images.length > 1 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
              +{post.images.length - 1} more
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-6">
        <button className={`flex items-center gap-2 text-sm ${post.isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'} transition-colors`}>
          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
          <span>{post.likesCount}</span>
        </button>
        <Link
          href={`/post/${post.id}#comments`}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-500 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.commentsCount}</span>
        </Link>
        <button className="flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-500 transition-colors ml-auto">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </Card>
  )
}
