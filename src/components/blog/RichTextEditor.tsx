'use client'

import { useState } from 'react'
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon, Eye, Edit2 } from 'lucide-react'
import RichTextRenderer from './RichTextRenderer'

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export default function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')

    const insertFormat = (prefix: string, suffix: string) => {
        const textarea = document.getElementById('post-editor') as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value
        const selection = text.substring(start, end)

        // If nothing selected, just insert markers
        const newText = text.substring(0, start) + prefix + (selection || '') + suffix + text.substring(end)
        onChange(newText)

        // Restore focus
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + prefix.length, end + prefix.length)
        }, 0)
    }

    return (
        <div className={`border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b border-zinc-700 bg-zinc-800/50">
                <div className="flex items-center gap-1">
                    {activeTab === 'write' ? (
                        <>
                            <button
                                type="button"
                                onClick={() => insertFormat('**', '**')}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                                title="Bold"
                            >
                                <Bold className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertFormat('*', '*')}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                                title="Italic"
                            >
                                <Italic className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-zinc-700 mx-1" />
                            <button
                                type="button"
                                onClick={() => insertFormat('[', '](url)')}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                                title="Link"
                            >
                                <LinkIcon className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertFormat('![alt]', '(url)')}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                                title="Image"
                            >
                                <ImageIcon className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <span className="text-xs text-zinc-400 font-medium px-2 py-1">Preview Mode</span>
                    )}
                </div>

                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-700">
                    <button
                        type="button"
                        onClick={() => setActiveTab('write')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'write'
                                ? 'bg-zinc-700 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                    >
                        <Edit2 className="w-3 h-3" />
                        Write
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'preview'
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                    >
                        <Eye className="w-3 h-3" />
                        Preview
                    </button>
                </div>
            </div>

            {/* Editor / Preview Area */}
            <div className="min-h-[300px] relative">
                {activeTab === 'write' ? (
                    <textarea
                        id="post-editor"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || "Write something amazing... (Paste YouTube links on their own line to embed)"}
                        className="w-full h-full min-h-[300px] p-4 bg-zinc-900 text-white placeholder-zinc-500 resize-y focus:outline-none font-mono text-sm leading-relaxed"
                    />
                ) : (
                    <div className="p-6 prose prose-invert max-w-none">
                        {value ? (
                            <RichTextRenderer content={value} />
                        ) : (
                            <div className="text-zinc-500 italic">Nothing to preview</div>
                        )}
                    </div>
                )}
            </div>

            {activeTab === 'write' && (
                <div className="bg-zinc-800/30 px-4 py-2 text-xs text-zinc-500 border-t border-zinc-800 flex justify-between">
                    <span>Supports basic markdown: **bold**, *italic*</span>
                    <span>Tip: Paste a YouTube/Vimeo URL on a new line to embed it</span>
                </div>
            )}
        </div>
    )
}
