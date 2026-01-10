'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Car,
  Users,
  Zap,
  Gauge,
  Activity,
  Trophy,
  Camera,
  Clock,
  Gamepad2,
  ChevronRight,
  TrendingUp,
  Star,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import FeedSidebar from '@/components/feed/FeedSidebar'
import ActivityPanel from '@/components/dashboard/ActivityPanel'
import QuickActions from '@/components/dashboard/QuickActions'

// --- Interfaces (Kept same as original) ---
interface FeedItem {
  id: string
  type: 'post' | 'car' | 'rating' | 'car_comment' | 'photo'
  createdAt: string
  activityText?: string
  data: {
    id: string
    title?: string
    content?: string
    thumbnail?: string
    image?: string
    url?: string
    caption?: string
    nickname?: string
    year?: number
    rating?: number
    comment?: string
    avgRating?: number | null
    ratingCount?: number
    commentCount?: number
    author?: {
      id: string
      username: string
      name: string | null
      avatar: string | null
    }
    user?: {
      id: string
      username: string
      name: string | null
      avatar: string | null
    }
    owner?: {
      id: string
      username: string
      name: string | null
      avatar: string | null
    }
    uploader?: {
      id: string
      username: string
      name: string | null
      avatar: string | null
    }
    car?: {
      id: string
      nickname: string | null
      year: number
      image?: string | null
      thumbnail?: string | null
      generation?: {
        name: string
        model: {
          name: string
          make: { name: string }
        }
      }
    }
    generation?: {
      name: string
      model: {
        name: string
        make: { name: string }
      }
    }
  }
}

interface DashboardStats {
  garageCars: number
  followers: number
  following: number
  posts: number
}

export default function FeedPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params?.locale as string || 'en'
  const { user, loading: authLoading, authenticated } = useAuth()

  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    garageCars: 0,
    followers: 0,
    following: 0,
    posts: 0,
  })

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.replace(`/${locale}`)
    }
  }, [authLoading, authenticated, router, locale])

  useEffect(() => {
    if (!authLoading && user) {
      fetchFeed()
      fetchStats()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [authLoading, user])

  const fetchFeed = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/feed/following?limit=30')
      const data = await res.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/users/${user?.username}`)
      if (res.ok) {
        const data = await res.json()
        setStats({
          garageCars: data.user?._count?.cars || 0,
          followers: data.user?._count?.followers || 0,
          following: data.user?._count?.following || 0,
          posts: data.user?._count?.posts || 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-zinc-800 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-t-orange-500 rounded-full animate-spin" />
            <Gauge className="absolute inset-0 m-auto w-8 h-8 text-zinc-600 animate-pulse" />
          </div>
          <p className="text-zinc-400 text-sm font-medium tracking-wider uppercase">Ignition Sequence...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500/30 font-sans">
      
      {/* Ambient Background Effects */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-zinc-900 via-zinc-950/80 to-zinc-950 pointer-events-none z-0" />
      <div className="fixed -top-[20%] -right-[10%] w-[800px] h-[800px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen" />
      <div className="fixed top-[10%] -left-[10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none z-0 mix-blend-screen" />

      {/* Main Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
             {/* Avatar/Welcome */}
             <div className="relative group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-xl overflow-hidden">
                   {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                        <Users className="w-6 h-6 text-zinc-500" />
                      </div>
                   )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-zinc-950 rounded-full" />
             </div>
             
             <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                   Hello, {user.name || user.username}
                   <span className="hidden md:inline-block animate-pulse">👋</span>
                </h1>
                <p className="text-zinc-400 text-sm flex items-center gap-2">
                   <Gauge className="w-3.5 h-3.5" />
                   <span>Welcome to your cockpit</span>
                </p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <Link 
               href={`/${locale}/u/${user.username}`} 
               className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium transition-all hover:scale-105 active:scale-95"
             >
                View Profile
             </Link>
             <Link 
               href={`/${locale}/settings`} 
               className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
             >
                <Gauge className="w-5 h-5" />
             </Link>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar (Navigation) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-6">
               <FeedSidebar locale={locale} user={user} />
               
               {/* Mini Footer for Sidebar */}
               <div className="pt-6 border-t border-zinc-800/50">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                     &copy; 2025 Motoverse. <br/>
                     Driving Passion, Digitally.
                  </p>
               </div>
            </div>
          </div>

          {/* Center Column (Main Feed & Actions) */}
          <main className="lg:col-span-6 space-y-8">
            
            {/* Stats Hero "Cockpit" */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/50 hover:border-orange-500/30 transition-all group">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform">
                        <Car className="w-5 h-5" />
                     </div>
                     <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Garage</span>
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="text-2xl font-bold text-white">{stats.garageCars}</span>
                     <span className="text-xs text-zinc-500 mb-1">cars</span>
                  </div>
               </div>

               <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/50 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5" />
                     </div>
                     <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Followers</span>
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="text-2xl font-bold text-white">{stats.followers}</span>
                     <span className="text-xs text-green-500 mb-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" /> 
                     </span>
                  </div>
               </div>

               <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/50 hover:border-purple-500/30 transition-all group">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                        <Star className="w-5 h-5" />
                     </div>
                     <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Posts</span>
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="text-2xl font-bold text-white">{stats.posts}</span>
                     <span className="text-xs text-zinc-500 mb-1">total</span>
                  </div>
               </div>

               <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/50 hover:border-emerald-500/30 transition-all group">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                        <Activity className="w-5 h-5" />
                     </div>
                     <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Rep</span>
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="text-2xl font-bold text-white">{stats.following}</span>
                     <span className="text-xs text-zinc-500 mb-1">following</span>
                  </div>
               </div>
            </div>

            {/* Quick Actions */}
            <section>
              <div className="flex items-center gap-2 mb-4 px-1">
                 <Zap className="w-4 h-4 text-orange-500" />
                 <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Quick Actions</h2>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 backdrop-blur-sm">
                <QuickActions locale={locale} />
              </div>
            </section>

            {/* Main Feed Area */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                   <Activity className="w-5 h-5 text-orange-500" />
                   Live Feed
                </h2>
                
                {/* Custom Tab Switcher */}
                <div className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center text-xs font-medium">
                   <button className="px-3 py-1.5 rounded-md bg-zinc-800 text-white shadow-sm">
                      Following
                   </button>
                   <button className="px-3 py-1.5 rounded-md text-zinc-500 hover:text-white transition-colors">
                      Discover
                   </button>
                </div>
              </div>

              {/* Feed Content Wrapper */}
              <div className="min-h-[400px]">
                 <ActivityPanel
                    items={items}
                    locale={locale}
                    loading={loading}
                    emptyMessage="Your timeline is quiet. Start following drivers or garages to rev up your feed!"
                 />
              </div>

              {items.length > 0 && (
                <div className="pt-6 pb-12 flex justify-center">
                   <button className="group px-6 py-3 rounded-full bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-2">
                      <span>Load More Activity</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              )}
            </section>
          </main>

          {/* Right Sidebar (Widgets) */}
          <aside className="hidden xl:block xl:col-span-3 space-y-6">
            
            {/* Explore Widget */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden backdrop-blur-sm">
               <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-purple-500" />
                     Explore Motoverse
                  </h3>
               </div>
               
               <div className="p-2 space-y-1">
                  <Link href={`/${locale}/simracing`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-all group">
                     <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:text-purple-300 group-hover:bg-purple-500/20 transition-colors">
                        <Gamepad2 className="w-5 h-5" />
                     </div>
                     <div className="flex-1">
                        <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">Sim Racing</div>
                        <div className="text-xs text-zinc-500">Global Leaderboards</div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </Link>

                  <Link href={`/${locale}/spots`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-all group">
                     <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:text-pink-300 group-hover:bg-pink-500/20 transition-colors">
                        <Camera className="w-5 h-5" />
                     </div>
                     <div className="flex-1">
                        <div className="text-sm font-medium text-white group-hover:text-pink-300 transition-colors">Car Spotting</div>
                        <div className="text-xs text-zinc-500">Rare finds nearby</div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-pink-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </Link>
                  
                  <Link href={`/${locale}/leaderboards`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-all group">
                     <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 group-hover:text-yellow-300 group-hover:bg-yellow-500/20 transition-colors">
                        <Trophy className="w-5 h-5" />
                     </div>
                     <div className="flex-1">
                        <div className="text-sm font-medium text-white group-hover:text-yellow-300 transition-colors">Hall of Fame</div>
                        <div className="text-xs text-zinc-500">Top contributors</div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </Link>
               </div>
            </div>

            {/* Trending / Lap Times Mini Widget */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Recent Laps
                </h3>
                <Link href={`/${locale}/simracing`} className="text-xs font-medium text-orange-500 hover:text-orange-400">
                   View All
                </Link>
              </div>
              <div className="p-6 flex flex-col items-center justify-center text-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-zinc-600" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-sm text-zinc-300 font-medium">No laps recorded yet</p>
                    <p className="text-xs text-zinc-500">Hit the track and set a record!</p>
                 </div>
              </div>
            </div>

            {/* Promo / Banner Area */}
            <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-zinc-800/60">
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10" />
               <img 
                  src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80" 
                  alt="Car Meet" 
                  className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-700"
               />
               <div className="absolute bottom-4 left-4 z-20">
                  <span className="px-2 py-1 rounded bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">Event</span>
                  <h4 className="text-white font-bold leading-tight">Weekend Drive</h4>
                  <p className="text-zinc-400 text-xs mt-1">Join 200+ drivers this Sunday</p>
               </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  )
}