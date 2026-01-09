'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  username: string
  name?: string | null
  avatar?: string | null
  role?: string
  isVerified?: boolean
  profileCompleted?: boolean
}

interface AuthState {
  authenticated: boolean
  user: AuthUser | null
  loading: boolean
}


export function useAuth() {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    user: null,
    loading: true,
  })
  const router = useRouter()
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // We can use the existing status endpoint which now uses the verified Supabase session
      const res = await fetch('/api/auth/status', {
        cache: 'no-store',
        headers: { 'x-no-cache': String(Date.now()) }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          return data.user
        }
      }
    } catch (e) {
      console.error('Failed to fetch profile', e)
    }
    return null
  }, [])

  useEffect(() => {
    let mounted = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        fetchProfile(session.user.id).then(user => {
          if (mounted) setState({ authenticated: !!user, user, loading: false })
        })
      } else {
        setState({ authenticated: false, user: null, loading: false })
      }
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const user = await fetchProfile(session.user.id)
          if (mounted) setState({ authenticated: !!user, user, loading: false })
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setState({ authenticated: false, user: null, loading: false })
        router.refresh()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile, router])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    // State update handled by onAuthStateChange
  }, [supabase])

  const refresh = useCallback(async () => {
    // Manual refresh if needed
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const user = await fetchProfile(session.user.id)
      setState({ authenticated: !!user, user, loading: false })
    } else {
      setState({ authenticated: false, user: null, loading: false })
    }
  }, [supabase, fetchProfile])

  return {
    ...state,
    refresh,
    logout,
  }
}

// Trigger auth refresh from anywhere (e.g., after login/register)
export function triggerAuthRefresh() {
  window.dispatchEvent(new CustomEvent('MOTOVERSE_AUTH_CHANGED'))
}
