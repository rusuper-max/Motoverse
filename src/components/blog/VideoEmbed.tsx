'use client'

import { useState } from 'react'

interface VideoEmbedProps {
    url: string
}

export default function VideoEmbed({ url }: VideoEmbedProps) {
    const [error, setError] = useState(false)

    const getEmbedUrl = (url: string): string | null => {
        try {
            // YouTube
            const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
            if (ytMatch && ytMatch[1]) {
                return `https://www.youtube.com/embed/${ytMatch[1]}`
            }

            // Vimeo
            const vimeoMatch = url.match(/(?:vimeo\.com\/)([0-9]+)/)
            if (vimeoMatch && vimeoMatch[1]) {
                return `https://player.vimeo.com/video/${vimeoMatch[1]}`
            }

            return null
        } catch {
            return null
        }
    }

    const embedUrl = getEmbedUrl(url)

    if (!embedUrl || error) return null

    return (
        <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video my-4 border border-zinc-800 shadow-lg">
            <iframe
                src={embedUrl}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => setError(true)}
            />
        </div>
    )
}
