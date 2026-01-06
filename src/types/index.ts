export type PostCategory = 'maintenance' | 'modification' | 'journey' | 'review' | 'other'

export interface UserProfile {
  id: string
  username: string
  name: string | null
  bio: string | null
  avatar: string | null
  coverImage: string | null
  location: string | null
  carsCount: number
  postsCount: number
  followersCount: number
  followingCount: number
}

export interface CarSummary {
  id: string
  make: string
  model: string
  year: number
  nickname: string | null
  image: string | null
}

export interface PostWithAuthor {
  id: string
  title: string
  content: string
  images: string[]
  category: PostCategory
  createdAt: Date
  author: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
  car: CarSummary | null
  likesCount: number
  commentsCount: number
  isLiked: boolean
}
