"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileSignature, Loader2, AlertCircle, Shield, CheckCircle2, Upload, Eye, Key } from "lucide-react"

interface PythonSignatureManagerProps {
  documentId: string
  documentTitle: string
  documentUrl: string
}

export default function PythonSignatureManager({
  documentId,
  documentTitle,
  documentUrl,
}: PythonSignatureManagerProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [isGeneratingCert, setIsGeneratingCert] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [signatureReason, setSignatureReason] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [certificateGenerated, setCertificateGenerated] = useState(false)

  const generateCertificate = async () => {
    setIsGeneratingCert(true)
    try {
      const response = await fetch("/api/generate-certificate-python", {
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
        title: "🔐 Certificado generado exitosamente",
        description: `Certificado: ${data.certificateName}`,
      })

      setCertificateGenerated(true)
    } catch (error: any) {
      console.error("Error generating certificate:", error)
      toast({
        variant: "destructive",
        title: "Error generando certificado",
        description: error.message,
      })
    } finally {
      setIsGeneratingCert(false)
    }
  }

  const signPDF = async () => {
    if (!pdfFile) {
      toast({
        variant: "destructive",
        title: "Selecciona un archivo PDF",
        description: "Debes subir el PDF que quieres firmar",
      })
      return
    }

    setIsSigning(true)
    try {
      const formData = new FormData()
      formData.append("documentId", documentId)
      formData.append("signatureReason", signatureReason)
      formData.append("pdf", pdfFile)

      const response = await fetch("/api/sign-pdf-python", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error firmando PDF")
      }

      // Download signed PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `signed_${documentTitle}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "✍️ PDF firmado exitosamente",
        description: "El archivo firmado se ha descargado automáticamente",
      })
    } catch (error: any) {
      console.error("Error signing PDF:", error)
      toast({
        variant: "destructive",
        title: "Error firmando PDF",
        description: error.message,
      })
    } finally {
      setIsSigning(false)
    }
  }

  const verifySignatures = async () => {
    if (!pdfFile) {
      toast({
        variant: "destructive",
        title: "Selecciona un archivo PDF",
        description: "Debes subir el PDF que quieres verificar",
      })
      return
    }

    setIsVerifying(true)
    try {
      const formData = new FormData()
      formData.append("pdf", pdfFile)
      formData.append("documentId", documentId)

      const response = await fetch("/api/verify-pdf-signatures", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error verificando firmas")
      }

      setVerificationResult(data)

      toast({
        title: "🔍 Verificación completada",
        description: `Se encontraron ${data.totalSignatures} firmas`,
      })
    } catch (error: any) {
      console.error("Error verifying signatures:", error)
      toast({
        variant: "destructive",
        title: "Error verificando firmas",
        description: error.message,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Certificate Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            1. Generar Certificado Digital
          </CardTitle>
          <CardDescription>Genera tu certificado digital personal para firmar documentos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Certificado con PyHanko y Cryptography:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Generación de claves RSA 2048-bit</li>
                <li>Certificado X.509 autofirmado</li>
                <li>Algoritmo SHA256withRSA</li>
                <li>Válido por 1 año</li>
                <li>Almacenamiento seguro en Supabase</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button onClick={generateCertificate} disabled={isGeneratingCert} className="bg-blue-600 hover:bg-blue-700">
              {isGeneratingCert ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando certificado...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Generar Certificado
                </>
              )}
            </Button>
          </div>

          {certificateGenerated && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>✅ Certificado generado y guardado en Supabase Storage</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* PDF Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            2. Subir PDF
          </CardTitle>
          <CardDescription>Sube el archivo PDF que quieres firmar o verificar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pdf-file">Archivo PDF</Label>
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setPdfFile(file)
              }}
            />
          </div>

          {pdfFile && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                📄 Archivo seleccionado: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* PDF Signing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            3. Firmar PDF
          </CardTitle>
          <CardDescription>Aplica tu firma digital al documento PDF</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="signature-reason">Motivo de la firma (opcional)</Label>
            <Textarea
              id="signature-reason"
              placeholder="Ej: Aprobación del documento, Revisión completada..."
              value={signatureReason}
              onChange={(e) => setSignatureReason(e.target.value)}
              rows={3}
            />
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Tu firma incluirá:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Timestamp exacto de la firma</li>
                <li>Hash SHA256 del documento</li>
                <li>Tu certificado X.509</li>
                <li>Motivo de la firma</li>
                <li>Ubicación: Casa Monarca - Sistema Digital</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button onClick={signPDF} disabled={isSigning || !pdfFile} className="bg-green-600 hover:bg-green-700">
              {isSigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Firmando PDF...
                </>
              ) : (
                <>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Firmar PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signature Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            4. Verificar Firmas
          </CardTitle>
          <CardDescription>Verifica la integridad y validez de las firmas en el PDF</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={verifySignatures} disabled={isVerifying || !pdfFile} variant="outline">
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Verificar Firmas
                </>
              )}
            </Button>
          </div>

          {verificationResult && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Resultado de verificación:</strong>
                  <br />📊 Total de firmas: {verificationResult.totalSignatures}
                  <br />🕒 Verificado: {new Date(verificationResult.verificationTime).toLocaleString()}
                  <br />✅ Estado:{" "}
                  {verificationResult.isValid ? "Todas las firmas son válidas" : "Algunas firmas no son válidas"}
                </AlertDescription>
              </Alert>

              {verificationResult.signatures.map((signature: any, index: number) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Firma #{index + 1}</h4>
                        <Badge variant={signature.is_valid ? "default" : "destructive"}>
                          {signature.is_valid ? "Válida" : "Inválida"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <strong>Firmante:</strong> {signature.signer_name}
                        </p>
                        <p>
                          <strong>Email:</strong> {signature.signer_email}
                        </p>
                        <p>
                          <strong>Fecha:</strong> {new Date(signature.signing_time).toLocaleString()}
                        </p>
                        <p>
                          <strong>Motivo:</strong> {signature.reason}
                        </p>
                        <p>
                          <strong>Ubicación:</strong> {signature.location}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Información Técnica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Tecnologías utilizadas:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <strong>PyHanko:</strong> Librería Python para firma digital de PDFs
                </li>
                <li>
                  <strong>Cryptography:</strong> Generación de certificados X.509
                </li>
                <li>
                  <strong>RSA 2048-bit:</strong> Algoritmo de clave pública
                </li>
                <li>
                  <strong>SHA256:</strong> Función hash criptográfica
                </li>
                <li>
                  <strong>Supabase Storage:</strong> Almacenamiento seguro de certificados
                </li>
              </ul>
              <br />
              <strong>Nota:</strong> Esta es una implementación de demostración. En producción se recomienda usar HSM
              (Hardware Security Modules) para el almacenamiento de claves privadas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
