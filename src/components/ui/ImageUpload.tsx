'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface ImageUploadProps {
    value: string[]
    onChange: (value: string[]) => void
    onRemove: (value: string) => void
    maxFiles?: number
    bucket?: string
    folderPath?: string
}

export default function ImageUpload({
    value,
    onChange,
    onRemove,
    maxFiles = 5,
    bucket = 'machinebio-photos',
    folderPath = 'uploads'
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const { user } = useAuth()
    const supabase = createClient()

    const onUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const files = e.target.files
            if (!files || files.length === 0) return

            // Check if user is authenticated
            if (!user?.id) {
                console.error('Upload failed: User not authenticated')
                alert('You must be logged in to upload images.')
                return
            }

            setIsUploading(true)
            const newUrls: string[] = []

            for (const file of Array.from(files)) {
                // Create unique path based on user and timestamp
                // Path: {userId}/{folderPath}/{timestamp}-{filename}
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${user.id}/${folderPath}/${fileName}`

                console.log('Uploading to:', bucket, filePath)

                const { data, error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file)

                if (uploadError) {
                    console.error('Supabase upload error:', uploadError)
                    throw uploadError
                }

                console.log('Upload success:', data)

                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(filePath)

                console.log('Public URL:', publicUrl)
                newUrls.push(publicUrl)
            }

            onChange([...value, ...newUrls])
        } catch (error: unknown) {
            const err = error as { message?: string; statusCode?: number }
            console.error('Error uploading image:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
            alert(`Failed to upload image: ${err?.message || 'Unknown error'}`)
        } finally {
            setIsUploading(false)
        }
    }, [value, onChange, user, bucket, folderPath, supabase])

    const onDelete = useCallback(async (url: string) => {
        // Optimistically remove from UI
        onRemove(url)

        // Attempt to delete from storage (optional, maybe we want to keep them?)
        // For now, let's just remove reference
    }, [onRemove])

    return (
        <div>
            <div className="mb-4 flex items-center gap-4">
                {value.map((url) => (
                    <div key={url} className="relative w-[200px] h-[200px] rounded-md overflow-hidden border border-zinc-700 group">
                        <div className="z-10 absolute top-2 right-2">
                            <button
                                type="button"
                                onClick={() => onDelete(url)}
                                className="bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                                title="Remove image"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            className="object-cover w-full h-full"
                            alt="Uploaded image"
                            src={url}
                        />
                    </div>
                ))}
            </div>

            {value.length < maxFiles && (
                <div className="flex items-center gap-4">
                    <label className="
                    cursor-pointer
                    w-[200px] h-[200px]
                    rounded-md
                    border-2 border-dashed border-zinc-700
                    flex flex-col items-center justify-center
                    gap-2
                    text-zinc-500
                    hover:border-zinc-500 hover:text-zinc-300
                    hover:bg-zinc-800/50
                    transition-all
                ">
                        {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <Upload className="w-6 h-6" />
                        )}
                        <span className="text-sm font-medium">
                            {isUploading ? 'Uploading...' : 'Upload Image'}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={onUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>
            )}
        </div>
    )
}
