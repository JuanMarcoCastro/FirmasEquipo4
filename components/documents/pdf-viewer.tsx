"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PDFViewerProps {
  fileUrl: string
  onPositionSelect?: (position: { pageNumber: number; x: number; y: number }) => void
  signatureMode?: boolean
}

export default function PDFViewer({ fileUrl, onPositionSelect, signatureMode = false }: PDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iframeHeight, setIframeHeight] = useState("70vh")
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    // Set loading to false after a short delay to allow iframe to load
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    // Adjust iframe height based on window size
    const updateHeight = () => {
      const vh = window.innerHeight * 0.7
      setIframeHeight(`${vh}px`)
    }

    updateHeight()
    window.addEventListener("resize", updateHeight)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", updateHeight)
    }
  }, [])

  const handleIframeError = () => {
    setError("No se pudo cargar el documento PDF en el visor integrado.")
    setShowFallback(true)
    setLoading(false)
  }

  const handleIframeLoad = () => {
    setLoading(false)
    setError(null)
  }

  // If signature mode is enabled, we can't use iframe effectively
  if (signatureMode) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Para seleccionar la posición de la firma, necesitas descargar el documento y usar un visor de PDF externo.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center space-x-4">
            <Button asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir en nueva pestaña
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={fileUrl} download>
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state or fallback
  if (error || showFallback) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-muted p-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Visor de PDF no disponible</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usa las opciones a continuación para ver el documento
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir en nueva pestaña
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={fileUrl} download>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </a>
              </Button>
            </div>

            {!showFallback && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null)
                  setShowFallback(false)
                  setLoading(true)
                }}
              >
                Reintentar visor
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando documento...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Use iframe to display PDF
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
            width="100%"
            height={iframeHeight}
            style={{ border: "none", backgroundColor: "white" }}
            title="PDF Viewer"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            ¿No se muestra correctamente?{" "}
            <button onClick={() => setShowFallback(true)} className="font-medium text-primary hover:underline">
              Ver opciones alternativas
            </button>
          </p>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-3 w-3" />
                Nueva pestaña
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={fileUrl} download>
                <Download className="mr-2 h-3 w-3" />
                Descargar
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
