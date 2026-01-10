'use client'

import { memo } from 'react'

interface IconProps {
    className?: string
    active?: boolean
    blink?: boolean
}

// Check Engine Light - for notifications
export const CheckEngineIcon = memo(function CheckEngineIcon({ className = '', active = false, blink = false }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${blink ? 'animate-dashboard-blink' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Engine block */}
            <path
                d="M5 8h2V6h2V4h6v2h2v2h2v3h1v6h-1v2H5v-2H4v-6h1V8z"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            {/* Engine details */}
            <path
                d="M8 11h8M8 14h8"
                stroke={active ? 'var(--icon-stroke, #18181b)' : 'currentColor'}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Exhaust pipe */}
            <path
                d="M19 12h2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    )
})

// Oil Pressure Light - for messages/DMs
export const OilPressureIcon = memo(function OilPressureIcon({ className = '', active = false, blink = false }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${blink ? 'animate-dashboard-blink' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Oil can body */}
            <path
                d="M4 14c0-2 1-3 3-3h6c2 0 3 1 3 3v4c0 1-1 2-2 2H6c-1 0-2-1-2-2v-4z"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            {/* Oil can spout */}
            <path
                d="M16 13l3-3h2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Oil drop */}
            <path
                d="M19 14c0 0 2 2 2 3.5c0 1-0.5 1.5-1.5 1.5s-1.5-0.5-1.5-1.5c0-1.5 1-3.5 1-3.5z"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            {/* Handle */}
            <path
                d="M7 11V8c0-1 1-2 2-2h2c1 0 2 1 2 2v3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    )
})

// Battery Light - could be used for system status
export const BatteryLightIcon = memo(function BatteryLightIcon({ className = '', active = false, blink = false }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${blink ? 'animate-dashboard-blink' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Battery body */}
            <rect
                x="3"
                y="7"
                width="16"
                height="10"
                rx="1"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
            />
            {/* Battery terminal */}
            <path
                d="M19 10h2v4h-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Plus sign */}
            <path
                d="M7 12h3M8.5 10.5v3"
                stroke={active ? 'var(--icon-stroke, #18181b)' : 'currentColor'}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Minus sign */}
            <path
                d="M13 12h3"
                stroke={active ? 'var(--icon-stroke, #18181b)' : 'currentColor'}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    )
})

// Temperature Warning - could be used for urgent notifications
export const TempWarningIcon = memo(function TempWarningIcon({ className = '', active = false, blink = false }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${blink ? 'animate-dashboard-blink' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Thermometer */}
            <path
                d="M12 3v12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <circle
                cx="12"
                cy="18"
                r="3"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
            />
            {/* Heat waves */}
            <path
                d="M17 7c1 0 2 1 2 2s-1 2-2 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M20 5c1.5 0 3 1.5 3 3.5s-1.5 3.5-3 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    )
})

// ABS Light style - generic warning
export const WarningLightIcon = memo(function WarningLightIcon({ className = '', active = false, blink = false }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${blink ? 'animate-dashboard-blink' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Circle with exclamation */}
            <circle
                cx="12"
                cy="12"
                r="9"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M12 7v5"
                stroke={active ? 'var(--icon-stroke, #18181b)' : 'currentColor'}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <circle
                cx="12"
                cy="16"
                r="1"
                fill={active ? 'var(--icon-stroke, #18181b)' : 'currentColor'}
            />
        </svg>
    )
})

// Fuel Light - could be for "low content" or empty states
export const FuelLightIcon = memo(function FuelLightIcon({ className = '', active = false, blink = false }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${blink ? 'animate-dashboard-blink' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Pump body */}
            <path
                d="M4 6h10v14H4V6z"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            {/* Pump top */}
            <path
                d="M6 6V4h6v2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Nozzle */}
            <path
                d="M14 8h3c1 0 2 1 2 2v6c0 1 1 2 2 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Fuel level indicator */}
            <rect
                x="6"
                y="10"
                width="6"
                height="6"
                rx="0.5"
                stroke={active ? 'var(--icon-stroke, #18181b)' : 'currentColor'}
                strokeWidth="1"
            />
        </svg>
    )
})

// Seatbelt/Safety - for security/account notifications
export const SeatbeltIcon = memo(function SeatbeltIcon({ className = '', active = false, blink = false }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${blink ? 'animate-dashboard-blink' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Person silhouette */}
            <circle
                cx="12"
                cy="6"
                r="3"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
            />
            {/* Body */}
            <path
                d="M8 21v-6c0-2 2-4 4-4s4 2 4 4v6"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Seatbelt diagonal */}
            <path
                d="M7 11l10 10"
                stroke={active ? 'var(--icon-stroke, #18181b)' : 'currentColor'}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    )
})

// Headlight High Beam - for "highlights" or featured content
export const HighBeamIcon = memo(function HighBeamIcon({ className = '', active = false, blink = false }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${blink ? 'animate-dashboard-blink' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Headlight housing */}
            <path
                d="M3 9c0-2 2-4 5-4h2c2 0 3 1 3 3v8c0 2-1 3-3 3H8c-3 0-5-2-5-4V9z"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
            />
            {/* Light beams */}
            <path
                d="M13 8h8M13 12h10M13 16h8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    )
})
