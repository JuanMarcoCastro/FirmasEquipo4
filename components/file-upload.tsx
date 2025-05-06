"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, FileText, Check } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface FileUploadProps {
  onUploadComplete?: (fileId: string, fileName: string) => void
  folderId?: string
}

export function FileUpload({ onUploadComplete, folderId = "1" }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const clearFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const simulateProgress = () => {
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 10
      setProgress(currentProgress)

      if (currentProgress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          setUploading(false)
          setSuccess(`Archivo "${file?.name}" subido correctamente`)

          // Simular ID generado por el servidor
          const fileId = `file-${Date.now()}`
          if (onUploadComplete && file) {
            onUploadComplete(fileId, file.name)
          }

          // Limpiar mensajes después de un tiempo
          setTimeout(() => {
            setSuccess(null)
            clearFile()
          }, 3000)
        }, 500)
      }
    }, 300)
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo para subir")
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)
    setSuccess(null)

    try {
      // En una implementación real, aquí enviaríamos el archivo al servidor
      // const formData = new FormData()
      // formData.append("file", file)
      // formData.append("folder_id", folderId)

      // const response = await fetch("/api/files/upload", {
      //   method: "POST",
      //   body: formData,
      // })

      // if (!response.ok) {
      //   throw new Error("Error al subir el archivo")
      // }

      // const data = await response.json()

      // Simulamos la subida para demostración
      simulateProgress()
    } catch (err) {
      setUploading(false)
      setError(err instanceof Error ? err.message : "Error al subir el archivo")
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="file-upload">Seleccionar Archivo</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            disabled={uploading}
            className="flex-1"
          />
          {file && !uploading && (
            <Button variant="ghost" size="icon" onClick={clearFile} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {file && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-accent/20">
          <FileText className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Subiendo...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
        {uploading ? (
          "Subiendo..."
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Subir Archivo
          </>
        )}
      </Button>
    </div>
  )
}
