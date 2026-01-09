'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AuthRedirect() {
  const { authenticated, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string || 'en'

  useEffect(() => {
    if (!loading && authenticated) {
      router.replace(`/${locale}/feed`)
    }
  }, [authenticated, loading, router, locale])

  return null
}
