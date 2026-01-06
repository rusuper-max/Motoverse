import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl',
  }

  if (!src) {
    return (
      <div
        className={`${sizes[size]} rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center ${className}`}
      >
        <span className={`${textSizes[size]} font-bold text-white`}>
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <div className={`${sizes[size]} relative rounded-full overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
      />
    </div>
  )
}
