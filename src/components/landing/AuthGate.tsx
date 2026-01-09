'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface AuthGateProps {
  children: React.ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const { authenticated, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (authenticated) {
        // Redirect to feed without showing landing page
        router.replace(`/${locale}/feed`)
      } else {
        // Not authenticated, show landing page
        setShouldShow(true)
      }
    }
  }, [authenticated, loading, router, locale])

  // Show loading while checking auth
  if (loading || (!shouldShow && !authenticated)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  // If authenticated, show nothing (will redirect)
  if (authenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  // Show landing page for non-authenticated users
  return <>{children}</>
}
