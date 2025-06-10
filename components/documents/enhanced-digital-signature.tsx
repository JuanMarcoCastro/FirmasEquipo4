"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FileSignature, Loader2, AlertCircle, Shield, CheckCircle2, Plus, Key, Clock } from "lucide-react"

interface CertificateType {
  id: string
  certificate_name: string
  created_at: string
  is_active: boolean
}

interface EnhancedDigitalSignatureProps {
  documentId: string
  userId: string
  documentTitle: string
}

export default function EnhancedDigitalSignature({ documentId, userId, documentTitle }: EnhancedDigitalSignatureProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()

  const [certificates, setCertificates] = useState<CertificateType[]>([])
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null)
  const [signatureReason, setSignatureReason] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isGeneratingCert, setIsGeneratingCert] = useState<boolean>(false)
  const [isLoadingCerts, setIsLoadingCerts] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"check" | "generate" | "select" | "sign">("check")

  useEffect(() => {
    loadUserCertificates()
  }, [])

  const loadUserCertificates = async () => {
    try {
      setIsLoadingCerts(true)
      const { data, error } = await supabase
        .from("user_certificates")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error

      setCertificates(data || [])

      if (data && data.length > 0) {
        setSelectedCertificate(data[0].id)
        setStep("sign")
      } else {
        setStep("generate")
      }
    } catch (error: any) {
      console.error("Error loading certificates:", error)
      setError("Error cargando certificados: " + error.message)
    } finally {
      setIsLoadingCerts(false)
    }
  }

  const generateCertificate = async () => {
    try {
      setIsGeneratingCert(true)
      setError(null)

      const response = await fetch("/api/generate-certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error generando certificado")
      }

      toast({
        title: "Certificado generado exitosamente",
        description: `Se ha creado tu certificado digital: ${data.certificateName}`,
      })

      // Reload certificates
      await loadUserCertificates()
    } catch (error: any) {
      console.error("Error generating certificate:", error)
      setError(error.message)
      toast({
        variant: "destructive",
        title: "Error generando certificado",
        description: error.message,
      })
    } finally {
      setIsGeneratingCert(false)
    }
  }

  const signDocument = async () => {
    if (!selectedCertificate) {
      toast({
        variant: "destructive",
        title: "Selecciona un certificado",
        description: "Debes seleccionar un certificado para firmar",
      })
      return
    }

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
          certificateId: selectedCertificate,
          signatureReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error firmando documento")
      }

      toast({
        title: "Documento firmado exitosamente",
        description: `Firma aplicada con hash: ${data.signatureHash?.substring(0, 16)}...`,
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

  if (isLoadingCerts) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-medium">Verificando certificados...</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Estamos verificando tus certificados digitales disponibles.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-medium">Firmando documento...</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Aplicando firma digital al documento. Este proceso puede tomar unos momentos.
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
          <div className="flex justify-center mt-4 space-x-2">
            <Button onClick={() => setError(null)}>Reintentar</Button>
            <Button variant="outline" onClick={() => router.back()}>
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Step 1: Generate Certificate
  if (step === "generate") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Generar Certificado Digital
            </CardTitle>
            <CardDescription>
              Necesitas un certificado digital para firmar documentos. Puedes generar uno automáticamente con nuestro
              sistema PyHanko.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Certificado Digital X.509:</strong>
                <br />
                Tu certificado digital garantiza la autenticidad de tus firmas. Incluye:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Tu información personal verificada</li>
                  <li>Claves criptográficas RSA 2048-bit</li>
                  <li>Validez temporal configurable</li>
                  <li>Algoritmos de seguridad SHA256withRSA</li>
                  <li>Cumplimiento con estándares X.509</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button onClick={generateCertificate} disabled={isGeneratingCert}>
                {isGeneratingCert ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generar Certificado
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: Select Certificate and Sign
  if (step === "sign") {
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
          <CardContent className="space-y-6">
            {/* Certificate Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Certificado Digital</Label>
              <div className="space-y-2">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCertificate === cert.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedCertificate(cert.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Key className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{cert.certificate_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Creado: {new Date(cert.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Activo</Badge>
                        {selectedCertificate === cert.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Reason */}
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

            {/* Information Alert */}
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Tu firma digital incluirá:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Timestamp exacto de la firma</li>
                  <li>Hash criptográfico único del documento</li>
                  <li>Tu certificado digital X.509</li>
                  <li>Motivo de la firma (si se proporciona)</li>
                  <li>Algoritmo de firma digital (SHA256withRSA)</li>
                  <li>Validación criptográfica completa</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button onClick={() => setStep("generate")} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Generar Nuevo Certificado
              </Button>
              <Button onClick={signDocument} disabled={!selectedCertificate}>
                <FileSignature className="mr-2 h-4 w-4" />
                Firmar Digitalmente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
