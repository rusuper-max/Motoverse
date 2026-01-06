'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface AuthUser {
  id: string
  email: string
  username: string
  name?: string | null
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
  const alive = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status', {
        cache: 'no-store',
        credentials: 'include',
        headers: { 'x-no-cache': String(Date.now()) },
      })
      const data = await res.json().catch(() => ({}))
      if (!alive.current) return
      setState({
        authenticated: !!data?.authenticated,
        user: data?.user ?? null,
        loading: false,
      })
    } catch {
      if (!alive.current) return
      setState({ authenticated: false, user: null, loading: false })
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setState({ authenticated: false, user: null, loading: false })
      // Dispatch custom event so other components can react
      window.dispatchEvent(new CustomEvent('MOTOVERSE_AUTH_CHANGED'))
    } catch {
      // Still clear local state even if request fails
      setState({ authenticated: false, user: null, loading: false })
    }
  }, [])

  useEffect(() => {
    alive.current = true
    refresh()

    // Listen for auth changes from other tabs/components
    const onChanged = () => refresh()
    const onFocus = () => refresh()
    const onVis = () => document.visibilityState === 'visible' && refresh()

    window.addEventListener('MOTOVERSE_AUTH_CHANGED', onChanged)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      alive.current = false
      window.removeEventListener('MOTOVERSE_AUTH_CHANGED', onChanged)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [refresh])

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
