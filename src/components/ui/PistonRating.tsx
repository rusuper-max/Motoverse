'use client'

import { useState } from 'react'

interface PistonRatingProps {
    value: number
    onChange?: (value: number) => void
    readonly?: boolean
    size?: 'sm' | 'md' | 'lg'
}

// Piston SVG component
const PistonIcon = ({ filled, size }: { filled: boolean; size: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-all duration-150 ${filled ? 'text-orange-500' : 'text-zinc-600'}`}
    >
        {/* Piston body */}
        <rect
            x="6" y="2" width="12" height="8" rx="1"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
        />
        {/* Piston rod */}
        <rect x="9" y="10" width="6" height="6" fill="currentColor" />
        {/* Connecting rod */}
        <path
            d="M12 16 L12 22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        {/* Rings */}
        <line x1="7" y1="5" x2="17" y2="5" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="0.5" opacity="0.5" />
        <line x1="7" y1="7" x2="17" y2="7" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="0.5" opacity="0.5" />
    </svg>
)

export default function PistonRating({
    value,
    onChange,
    readonly = false,
    size = 'md'
}: PistonRatingProps) {
    const [hoverValue, setHoverValue] = useState(0)

    const sizeMap = {
        sm: 16,
        md: 24,
        lg: 32,
    }

    const iconSize = sizeMap[size]

    const displayValue = hoverValue || value

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
                <button
                    key={rating}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(rating)}
                    onMouseEnter={() => !readonly && setHoverValue(rating)}
                    onMouseLeave={() => !readonly && setHoverValue(0)}
                    className={`p-0.5 transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
                        }`}
                >
                    <PistonIcon
                        filled={rating <= displayValue}
                        size={iconSize}
                    />
                </button>
            ))}
            <span className={`ml-2 font-bold ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'
                } text-white`}>
                {value > 0 ? value.toFixed(1) : '-'}/10
            </span>
        </div>
    )
}
