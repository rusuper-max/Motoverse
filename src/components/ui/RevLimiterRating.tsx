'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface RevLimiterRatingProps {
  value: number | null // 0-10000
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  label?: string
}

export default function RevLimiterRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showValue = true,
  label,
}: RevLimiterRatingProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayValue = hoverValue ?? value ?? 0

  // Size configurations
  const sizeConfig = {
    sm: { width: 140, height: 95, fontSize: 9 },
    md: { width: 200, height: 135, fontSize: 11 },
    lg: { width: 280, height: 190, fontSize: 14 },
  }

  const config = sizeConfig[size]

  // The gauge arc spans from -135° to +135° (270° total)
  // 0 RPM = -135°, 10000 RPM = +135°
  const valueToAngle = (val: number) => {
    const normalizedVal = Math.max(0, Math.min(10000, val))
    return -135 + (normalizedVal / 10000) * 270
  }

  // Convert position to value
  const positionToValue = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return 0

    const rect = svgRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height * 0.85

    const deltaX = clientX - centerX
    const deltaY = centerY - clientY

    let angle = Math.atan2(deltaX, deltaY) * (180 / Math.PI)
    angle = Math.max(-135, Math.min(135, angle))

    const newValue = ((angle + 135) / 270) * 10000
    return Math.round(newValue / 100) * 100
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readonly || !onChange) return
    setIsDragging(true)
    const newValue = positionToValue(e.clientX, e.clientY)
    onChange(newValue)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !onChange) return
    const newValue = positionToValue(e.clientX, e.clientY)
    onChange(newValue)
  }, [isDragging, onChange, positionToValue])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleHover = (e: React.MouseEvent) => {
    if (readonly || isDragging) return
    const newValue = positionToValue(e.clientX, e.clientY)
    setHoverValue(newValue)
  }

  const handleMouseLeave = () => {
    setHoverValue(null)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const needleAngle = valueToAngle(displayValue)
  const isInRedZone = displayValue >= 8000

  // SVG viewBox dimensions
  const viewBoxWidth = 200
  const viewBoxHeight = 130
  const centerX = 100
  const centerY = 105

  // Arc radius
  const arcRadius = 75
  const arcWidth = 12

  // Generate tick marks and numbers - positioned INSIDE the arc
  const ticks = Array.from({ length: 11 }, (_, i) => i)

  return (
    <div
      ref={containerRef}
      className={`relative select-none flex flex-col items-center ${!readonly ? 'cursor-pointer' : ''}`}
      style={{ width: config.width }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleHover}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        style={{ width: config.width, height: config.height }}
      >
        {/* Background arc */}
        <path
          d={describeArc(centerX, centerY, arcRadius, -135, 135)}
          fill="none"
          stroke="#18181b"
          strokeWidth={arcWidth + 4}
          strokeLinecap="round"
        />

        {/* Green zone (0-8000) - 0% to 80% of arc */}
        <path
          d={describeArc(centerX, centerY, arcRadius, -135, 81)}
          fill="none"
          stroke="#22c55e"
          strokeWidth={arcWidth}
          strokeLinecap="round"
        />

        {/* Red zone (8000-10000) - 80% to 100% of arc */}
        <path
          d={describeArc(centerX, centerY, arcRadius, 81, 135)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={arcWidth}
          strokeLinecap="round"
        />

        {/* Tick marks and numbers - INSIDE the arc */}
        {ticks.map((tick) => {
          const tickAngle = -135 + (tick / 10) * 270
          const rad = (tickAngle - 90) * (Math.PI / 180)

          // Tick marks on the inner edge of arc
          const tickOuterRadius = arcRadius - arcWidth / 2 - 2
          const tickInnerRadius = tickOuterRadius - (tick % 2 === 0 ? 8 : 5)

          const x1 = centerX + tickInnerRadius * Math.cos(rad)
          const y1 = centerY + tickInnerRadius * Math.sin(rad)
          const x2 = centerX + tickOuterRadius * Math.cos(rad)
          const y2 = centerY + tickOuterRadius * Math.sin(rad)

          // Numbers positioned inside ticks
          const textRadius = tickInnerRadius - 10
          const textX = centerX + textRadius * Math.cos(rad)
          const textY = centerY + textRadius * Math.sin(rad)

          return (
            <g key={tick}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={tick >= 8 ? '#ef4444' : '#52525b'}
                strokeWidth={tick % 2 === 0 ? 2 : 1}
              />
              {tick % 2 === 0 && (
                <text
                  x={textX}
                  y={textY}
                  fill={tick >= 8 ? '#ef4444' : '#a1a1aa'}
                  fontSize={config.fontSize}
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {tick}
                </text>
              )}
            </g>
          )
        })}

        {/* RPM label in center */}
        <text
          x={centerX}
          y={centerY - 25}
          fill="#71717a"
          fontSize="8"
          fontWeight="500"
          textAnchor="middle"
        >
          x1000 RPM
        </text>

        {/* Needle */}
        <g
          transform={`rotate(${needleAngle}, ${centerX}, ${centerY})`}
          className="transition-transform duration-100 ease-out"
        >
          {/* Needle shadow */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - 55}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Main needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - 52}
            stroke={isInRedZone ? '#ef4444' : '#f97316'}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              filter: isInRedZone
                ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))'
                : 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.6))',
            }}
          />
        </g>

        {/* Center cap */}
        <circle
          cx={centerX}
          cy={centerY}
          r="8"
          fill="#27272a"
          stroke={isInRedZone ? '#ef4444' : '#f97316'}
          strokeWidth="2.5"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r="3"
          fill={isInRedZone ? '#ef4444' : '#f97316'}
        />

        {/* Digital readout */}
        {showValue && (
          <text
            x={centerX}
            y={viewBoxHeight - 5}
            fill={isInRedZone ? '#ef4444' : '#f97316'}
            fontSize="14"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
            style={{
              filter: isInRedZone
                ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))'
                : 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.4))',
            }}
          >
            {(displayValue / 1000).toFixed(1)}k RPM
          </text>
        )}
      </svg>

      {label && (
        <p className="text-zinc-400 text-sm mt-1">{label}</p>
      )}
    </div>
  )
}

// Helper function to describe an SVG arc
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}
