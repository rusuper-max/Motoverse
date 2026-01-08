'use client'

import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface VerificationBadgeProps {
    status: 'approved' | 'pending' | 'rejected' | 'unverified'
    size?: 'sm' | 'md'
    showText?: boolean
}

export default function VerificationBadge({
    status,
    size = 'sm',
    showText = true
}: VerificationBadgeProps) {
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

    if (status === 'approved') {
        return (
            <span className={`inline-flex items-center gap-1 ${textSize} text-green-400`}>
                <CheckCircle className={iconSize} />
                {showText && 'Verified'}
            </span>
        )
    }

    if (status === 'pending') {
        return (
            <span className={`inline-flex items-center gap-1 ${textSize} text-yellow-400`}>
                <Clock className={iconSize} />
                {showText && 'Pending Review'}
            </span>
        )
    }

    if (status === 'rejected') {
        return (
            <span className={`inline-flex items-center gap-1 ${textSize} text-red-400`}>
                <AlertCircle className={iconSize} />
                {showText && 'Rejected'}
            </span>
        )
    }

    // Unverified - no badge
    return null
}
