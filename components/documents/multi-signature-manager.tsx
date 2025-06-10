"use client"

import type React from "react"

import { useState, type FC } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileSignature, ShieldCheck, ShieldX, Calendar, MessageSquare, Info } from "lucide-react"

interface SignatureVerificationResult {
  signer_name: string
  signing_time: string
  reason: string
  location: string
  valid: boolean
  intact: boolean
  trusted: boolean
  summary: string
  error?: string
}

const signers = [
  { id: "user1", name: "Juan Pérez", email: "juan.perez@casamonarca.org" },
  { id: "user2", name: "Maria García", email: "maria.garcia@casamonarca.org" },
  { id: "user3", name: "Admin General", email: "admin@casamonarca.org" },
]

export const MultiSignatureManager: FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [verificationResult, setVerificationResult] = useState<SignatureVerificationResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setPdfFile(file)
      setSignedPdfUrl(URL.createObjectURL(file))
      setVerificationResult(null)
      setError(null)
    } else {
      setError("Por favor, selecciona un archivo PDF válido.")
    }
  }

  const handleSign = async (userName: string, email: string) => {
    if (!pdfFile) {
      setError("Primero debes subir un documento PDF.")
      return
    }
    setIsProcessing(true)
    setError(null)
    setVerificationResult(null)

    const formData = new FormData()
    formData.append("pdf", pdfFile)
    formData.append("userName", userName)
    formData.append("email", email)
    formData.append("reason", `Firmado por ${userName}`)

    try {
      const response = await fetch("/api/sign-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al firmar el documento.")
      }

      const signedPdfBlob = await response.blob()
      setPdfFile(new File([signedPdfBlob], pdfFile.name, { type: "application/pdf" }))
      if (signedPdfUrl) {
        URL.revokeObjectURL(signedPdfUrl)
      }
      setSignedPdfUrl(URL.createObjectURL(signedPdfBlob))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVerify = async () => {
    if (!pdfFile) {
      setError("Primero debes subir o firmar un documento.")
      return
    }
    setIsProcessing(true)
    setError(null)

    const formData = new FormData()
    formData.append("pdf", pdfFile)

    try {
      const response = await fetch("/api/verify-signatures", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al verificar las firmas.")
      }

      const result = await response.json()
      setVerificationResult(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Gestor de Firmas Digitales Múltiples</CardTitle>
          <CardDescription>
            Sube un PDF, permite que varios usuarios lo firmen y verifica la integridad de las firmas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pdf-upload">1. Sube tu documento PDF</Label>
            <Input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="mt-2" />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {pdfFile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa del Documento</CardTitle>
              </CardHeader>
              <CardContent>
                {signedPdfUrl ? (
                  <iframe
                    src={signedPdfUrl}
                    className="w-full h-[600px] border rounded-md"
                    title="PDF Preview"
                  ></iframe>
                ) : (
                  <div className="w-full h-[600px] border rounded-md flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground">Sube un PDF para verlo aquí.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>2. Aplicar Firmas</CardTitle>
                <CardDescription>
                  Selecciona un usuario para firmar el documento. Cada firma se añade de forma incremental.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {signers.map((signer) => (
                  <Button
                    key={signer.id}
                    onClick={() => handleSign(signer.name, signer.email)}
                    disabled={isProcessing}
                    className="w-full justify-start"
                  >
                    <FileSignature className="mr-2 h-4 w-4" />
                    Firmar como {signer.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Verificar Firmas</CardTitle>
                <CardDescription>Valida todas las firmas aplicadas al documento.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleVerify} disabled={isProcessing} className="w-full">
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Verificar Todas las Firmas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <Loader2 className="h-16 w-16 animate-spin" />
        </div>
      )}

      {verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Verificación</CardTitle>
            <CardDescription>Se encontraron {verificationResult.length} firma(s) en el documento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationResult.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>No se encontraron firmas en el documento.</AlertDescription>
              </Alert>
            )}
            {verificationResult.map((sig, index) => (
              <Alert key={index} variant={sig.valid && sig.intact ? "default" : "destructive"}>
                {sig.valid && sig.intact ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
                <AlertTitle className="flex items-center justify-between">
                  <span>
                    Firma #{index + 1}: {sig.signer_name}
                  </span>
                  <Badge variant={sig.valid && sig.intact ? "secondary" : "destructive"}>
                    {sig.valid && sig.intact ? "Válida e Íntegra" : "Inválida o Corrupta"}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4" /> <strong>Fecha:</strong> {sig.signing_time}
                  </div>
                  <div className="flex items-center text-sm">
                    <MessageSquare className="mr-2 h-4 w-4" /> <strong>Motivo:</strong> {sig.reason}
                  </div>
                  <p className="text-xs pt-2 border-t mt-2">{sig.summary}</p>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
