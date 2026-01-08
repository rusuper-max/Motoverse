'use client'

import { useState } from 'react'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'

interface FollowButtonProps {
  username: string
  initialIsFollowing: boolean
  initialFollowerCount: number
  onFollowChange?: (isFollowing: boolean, newCount: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function FollowButton({
  username,
  initialIsFollowing,
  initialFollowerCount,
  onFollowChange,
  size = 'md',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.error === 'unauthorized') {
          // Redirect to login
          window.location.href = '/login'
          return
        }
        throw new Error(data.error || 'Failed to update follow status')
      }

      const data = await res.json()
      setIsFollowing(data.isFollowing)
      setFollowerCount(data.followerCount)
      onFollowChange?.(data.isFollowing, data.followerCount)
    } catch (error) {
      console.error('Follow action failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        inline-flex items-center gap-2 rounded-lg font-medium transition-all
        ${sizeClasses[size]}
        ${isFollowing
          ? 'bg-zinc-800 text-zinc-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 border border-zinc-700'
          : 'bg-orange-500 text-white hover:bg-orange-600'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </button>
  )
}
