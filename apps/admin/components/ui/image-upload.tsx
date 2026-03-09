"use client"

import { useState, useRef } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  bucket: string
  folder?: string
  maxSizeMB?: number
  aspectRatio?: "square" | "video" | "banner" | "thumbnail"
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  bucket,
  folder = "",
  maxSizeMB = 5,
  aspectRatio = "banner",
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    banner: "aspect-[3/1]",
    thumbnail: "aspect-square",
  }

  const widthClasses = {
    square: "w-full",
    video: "w-full",
    banner: "w-full",
    thumbnail: "w-32",
  }

  const handleUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.")
      return
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }

    setUploading(true)

    try {
      const supabase = createBrowserSupabaseClient()

      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Delete old image if exists
      if (value) {
        const oldPath = value.split(`${bucket}/`)[1]
        if (oldPath) {
          await supabase.storage.from(bucket).remove([oldPath])
        }
      }

      // Upload new image
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) {
        console.error("Upload error:", error)
        toast.error(`Upload failed: ${error.message}`)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      onChange(publicUrl)
      toast.success("Image uploaded successfully!")
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(`Upload failed: ${error.message || "Unknown error"}`)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!value) return

    setUploading(true)

    try {
      const supabase = createBrowserSupabaseClient()

      // Extract path from URL
      const oldPath = value.split(`${bucket}/`)[1]
      if (oldPath) {
        const { error } = await supabase.storage.from(bucket).remove([oldPath])
        if (error) {
          console.error("Delete error:", error)
        }
      }

      onChange(null)
      toast.success("Image removed")
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error(`Failed to remove image: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0])
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className={`relative ${aspectRatioClasses[aspectRatio]} ${widthClasses[aspectRatio]} overflow-hidden rounded-lg border bg-muted`}>
          <Image
            src={value}
            alt="League image"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          {!disabled && (
            <div className={`absolute flex gap-1 ${aspectRatio === "thumbnail" ? "top-1 right-1" : "top-2 right-2 gap-2"}`}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={aspectRatio === "thumbnail" ? "h-6 w-6 p-0" : ""}
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className={`${aspectRatio === "thumbnail" ? "h-3 w-3" : "h-4 w-4"} animate-spin`} />
                ) : (
                  <Upload className={aspectRatio === "thumbnail" ? "h-3 w-3" : "h-4 w-4"} />
                )}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className={aspectRatio === "thumbnail" ? "h-6 w-6 p-0" : ""}
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className={aspectRatio === "thumbnail" ? "h-3 w-3" : "h-4 w-4"} />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`
            relative ${aspectRatioClasses[aspectRatio]} ${widthClasses[aspectRatio]} rounded-lg border-2 border-dashed
            ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}
            transition-colors
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <div className={`absolute inset-0 flex flex-col items-center justify-center text-muted-foreground ${aspectRatio === "thumbnail" ? "gap-1 p-2" : "gap-2"}`}>
            {uploading ? (
              <>
                <Loader2 className={`${aspectRatio === "thumbnail" ? "h-5 w-5" : "h-8 w-8"} animate-spin`} />
                {aspectRatio !== "thumbnail" && <span className="text-sm">Uploading...</span>}
              </>
            ) : aspectRatio === "thumbnail" ? (
              <>
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs font-medium text-center">Click to upload</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm font-medium">
                  Drop image here or click to upload
                </span>
                <span className="text-xs">
                  JPG, PNG, WebP or GIF (max {maxSizeMB}MB)
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />
    </div>
  )
}
