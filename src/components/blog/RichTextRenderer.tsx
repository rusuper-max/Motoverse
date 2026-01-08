'use client'

import VideoEmbed from './VideoEmbed'

interface RichTextRendererProps {
    content: string
}

export default function RichTextRenderer({ content }: RichTextRendererProps) {
    // Simple parser that handles newlines and detects video URLs
    // This is a basic implementation "forums style"

    const renderParagraph = (text: string, index: number) => {
        // Check if the paragraph is just a video URL
        const videoUrlPattern = /^(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)\/[^\s]+)$/
        if (videoUrlPattern.test(text.trim())) {
            return <VideoEmbed key={index} url={text.trim()} />
        }

        // Basic formatting
        // Convert **text** to bold, *text* to italic
        // This is a naive implementation but works for basic cases without external libs
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)

        return (
            <p key={index} className="mb-4 text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="text-white">{part.slice(2, -2)}</strong>
                    }
                    if (part.startsWith('*') && part.endsWith('*')) {
                        return <em key={i} className="text-zinc-200">{part.slice(1, -1)}</em>
                    }
                    return part
                })}
            </p>
        )
    }

    return (
        <div className="rich-text-content">
            {content.split('\n').map((paragraph, index) => {
                if (!paragraph.trim()) return <div key={index} className="h-4" />
                return renderParagraph(paragraph, index)
            })}
        </div>
    )
}
