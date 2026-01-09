'use client'

import { Shield, Crown, Wrench } from 'lucide-react'

interface RoleBadgeProps {
    role: string
    size?: 'sm' | 'md'
}

export default function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
    const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'

    if (role === 'founder') {
        return (
            <span className={`inline-flex items-center gap-1 ${textSize} ${padding} rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 font-medium`}>
                <Crown className={iconSize} />
                Founder
            </span>
        )
    }

    if (role === 'admin') {
        return (
            <span className={`inline-flex items-center gap-1 ${textSize} ${padding} rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium`}>
                <Shield className={iconSize} />
                Admin
            </span>
        )
    }

    if (role === 'moderator') {
        return (
            <span className={`inline-flex items-center gap-1 ${textSize} ${padding} rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium`}>
                <Wrench className={iconSize} />
                Moderator
            </span>
        )
    }

    // No badge for regular users
    return null
}
