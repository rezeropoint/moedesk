"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Video, ImageIcon, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type FileType = "video" | "image"

interface UploadResult {
  fileName: string
  publicUrl: string
  internalUrl: string
  type: FileType
  size: number
  originalName: string
}

interface FileUploadProps {
  type: FileType
  value?: string // publicUrl
  internalUrl?: string
  onChange: (publicUrl: string | undefined, internalUrl: string | undefined) => void
  className?: string
  disabled?: boolean
}

type UploadStatus = "idle" | "uploading" | "success" | "error"

export function FileUpload({
  type,
  value,
  onChange,
  className,
  disabled,
}: FileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>(value ? "success" : "idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string>()
  const [fileName, setFileName] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptTypes =
    type === "video"
      ? "video/mp4,video/quicktime,video/x-msvideo,video/webm"
      : "image/jpeg,image/png,image/webp,image/gif"

  const maxSize = type === "video" ? "2GB" : "10MB"

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setStatus("uploading")
      setProgress(0)
      setError(undefined)
      setFileName(file.name)

      try {
        const formData = new FormData()
        formData.append("file", file)

        // 使用 XMLHttpRequest 以获取进度
        const xhr = new XMLHttpRequest()

        await new Promise<UploadResult>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100)
              setProgress(percent)
            }
          })

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText)
              if (response.data) {
                resolve(response.data)
              } else {
                reject(new Error(response.error || "上传失败"))
              }
            } else {
              const response = xhr.responseText
                ? JSON.parse(xhr.responseText)
                : { error: `上传失败 (${xhr.status})` }
              reject(new Error(response.details || response.error || "上传失败"))
            }
          })

          xhr.addEventListener("error", () => {
            reject(new Error("网络错误"))
          })

          xhr.open("POST", "/api/upload")
          xhr.send(formData)
        }).then((result) => {
          setStatus("success")
          setProgress(100)
          onChange(result.publicUrl, result.internalUrl)
        })
      } catch (err) {
        setStatus("error")
        setError(err instanceof Error ? err.message : "上传失败")
        console.error("Upload failed:", err)
      }

      // 重置 input，允许重新选择同一文件
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    setStatus("idle")
    setProgress(0)
    setError(undefined)
    setFileName(undefined)
    onChange(undefined, undefined)
  }, [onChange])

  const Icon = type === "video" ? Video : ImageIcon

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || status === "uploading"}
      />

      {status === "idle" && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-24 border-dashed flex flex-col gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            点击上传{type === "video" ? "视频" : "图片"}
          </span>
          <span className="text-xs text-muted-foreground">
            最大 {maxSize}
          </span>
        </Button>
      )}

      {status === "uploading" && (
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm truncate flex-1">{fileName}</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {status === "success" && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-status-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm truncate block">{fileName || value}</span>
              {type === "video" && value && (
                <video
                  src={value}
                  className="mt-2 w-full max-h-32 rounded object-cover"
                  muted
                />
              )}
              {type === "image" && value && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={value}
                  alt="封面预览"
                  className="mt-2 w-full max-h-32 rounded object-cover"
                />
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-destructive">{error}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              重试
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
