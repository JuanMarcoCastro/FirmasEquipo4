"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileSignature, Loader2, AlertCircle, Shield, CheckCircle2 } from "lucide-react"

interface DigitalSignatureFormProps {
  documentId: string
  userId: string
  documentTitle: string
  userCertificates: any[]
}

export default function DigitalSignatureForm({
  documentId,
  userId,
  documentTitle,
  userCertificates,
}: DigitalSignatureFormProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()

  const [signatureReason, setSignatureReason] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignDocument = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/sign-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          certificateId: userCertificates[0]?.id || null, // Use first available certificate or null
          signatureReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error firmando documento")
      }

      toast({
        title: "Documento firmado exitosamente",
        description: `El documento ha sido firmado digitalmente. Hash: ${data.signatureHash?.substring(0, 16)}...`,
      })

      router.push(`/dashboard/documents/${documentId}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error signing document:", error)
      setError(error.message)
      toast({
        variant: "destructive",
        title: "Error firmando documento",
        description: error.message,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-medium">Firmando documento...</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Estamos aplicando tu firma digital al documento. Este proceso puede tomar unos momentos.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={() => setError(null)}>Reintentar</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Firmar Documento Digitalmente
          </CardTitle>
          <CardDescription>Vas a firmar digitalmente el documento "{documentTitle}"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Esta es una implementación de demostración de firma digital. En producción, se usaría PyHanko con
              certificados reales.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo de la firma (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Ej: Aprobación del documento, Revisión completada, Autorización otorgada..."
              value={signatureReason}
              onChange={(e) => setSignatureReason(e.target.value)}
              rows={3}
            />
          </div>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Tu firma digital incluirá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Timestamp de la firma</li>
                <li>Hash criptográfico único</li>
                <li>Tu información de usuario</li>
                <li>Motivo de la firma</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button onClick={handleSignDocument}>
              <FileSignature className="mr-2 h-4 w-4" />
              Firmar Digitalmente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
