'use client'

import { ReactNode } from 'react'
import { AnimationProvider } from '@/contexts/AnimationContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AnimationProvider>
      {children}
    </AnimationProvider>
  )
}
