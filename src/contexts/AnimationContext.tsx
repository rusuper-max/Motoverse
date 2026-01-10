'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AnimationSettings {
    // Master toggle
    animationsEnabled: boolean

    // Individual toggles
    notificationAnimations: boolean
    feedAnimations: boolean
    pageTransitions: boolean
    hoverEffects: boolean
    loadingAnimations: boolean

    // Intensity (for future use)
    animationSpeed: 'slow' | 'normal' | 'fast'
}

interface AnimationContextType {
    settings: AnimationSettings
    updateSetting: <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) => void
    toggleAll: (enabled: boolean) => void
    shouldAnimate: (type: keyof Omit<AnimationSettings, 'animationsEnabled' | 'animationSpeed'>) => boolean
}

const defaultSettings: AnimationSettings = {
    animationsEnabled: true,
    notificationAnimations: true,
    feedAnimations: true,
    pageTransitions: true,
    hoverEffects: true,
    loadingAnimations: true,
    animationSpeed: 'normal',
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

const STORAGE_KEY = 'machinebio-animation-settings'

export function AnimationProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AnimationSettings>(defaultSettings)
    const [isHydrated, setIsHydrated] = useState(false)

    // Load settings from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                setSettings({ ...defaultSettings, ...parsed })
            } catch {
                // Invalid JSON, use defaults
            }
        }
        setIsHydrated(true)
    }, [])

    // Save settings to localStorage whenever they change
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
        }
    }, [settings, isHydrated])

    // Also respect prefers-reduced-motion
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            if (e.matches) {
                setSettings(prev => ({ ...prev, animationsEnabled: false }))
            }
        }

        // Check on mount
        handleChange(mediaQuery)

        // Listen for changes
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    const updateSetting = <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const toggleAll = (enabled: boolean) => {
        setSettings(prev => ({
            ...prev,
            animationsEnabled: enabled,
            notificationAnimations: enabled,
            feedAnimations: enabled,
            pageTransitions: enabled,
            hoverEffects: enabled,
            loadingAnimations: enabled,
        }))
    }

    const shouldAnimate = (type: keyof Omit<AnimationSettings, 'animationsEnabled' | 'animationSpeed'>) => {
        // If master toggle is off, nothing animates
        if (!settings.animationsEnabled) return false
        // Otherwise check the specific toggle
        return settings[type]
    }

    return (
        <AnimationContext.Provider value={{ settings, updateSetting, toggleAll, shouldAnimate }}>
            {children}
        </AnimationContext.Provider>
    )
}

export function useAnimations() {
    const context = useContext(AnimationContext)
    if (context === undefined) {
        throw new Error('useAnimations must be used within an AnimationProvider')
    }
    return context
}

// Hook for getting animation class based on settings
export function useAnimationClass(
    type: keyof Omit<AnimationSettings, 'animationsEnabled' | 'animationSpeed'>,
    animationClass: string,
    fallbackClass: string = ''
) {
    const { shouldAnimate } = useAnimations()
    return shouldAnimate(type) ? animationClass : fallbackClass
}
