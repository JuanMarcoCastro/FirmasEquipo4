"use client"

import type React from "react"
import { useState, useEffect, type FC } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, FileSignature, ShieldCheck, UploadCloud, Info, KeyRound, Sparkles } from "lucide-react"
import { useSupabase } from "@/lib/supabase-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"

interface UserCertificate {
  id: string
  certificate_name: string
  created_at: string
  // Campos que podríamos añadir si los consultamos
  cert_common_name?: string
  cert_organizational_unit?: string
  cert_fingerprint_sha256?: string
}

interface SignatureVerification {
  signature_index: number
  signer_name_field: string
  signing_time: string
  reason: string
  location: string
  valid: boolean
  intact: boolean
  trusted: boolean
  coverage: string
  summary: string
  modifications_since_signature: boolean
  certificate_details: {
    signer_name_from_cert: string
    signer_email: string
    signer_org: string
    signer_org_unit: string
    signer_country: string
    valid_from: string
    valid_to: string
    serial_number: string
    issuer_name: string
    fingerprint_sha256: string
  }
  error?: string
}

export const ProfessionalSignatureSuite: FC = () => {
  const { supabase, session } = useSupabase()
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null)
  const [uploadCertificateName, setUploadCertificateName] = useState<string>("")

  const [generateCertNamePrefix, setGenerateCertNamePrefix] = useState<string>("Certificado Personal")
  const [generateCertDaysValid, setGenerateCertDaysValid] = useState<number>(365)
  const [generateCertOrgUnit, setGenerateCertOrgUnit] = useState<string>("") // Nuevo estado
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)

  const [userCertificates, setUserCertificates] = useState<UserCertificate[]>([])
  const [selectedCertificateId, setSelectedCertificateId] = useState<string>("")
  const [signReason, setSignReason] = useState<string>("Firma de conformidad")
  const [verificationResults, setVerificationResults] = useState<SignatureVerification[] | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchUserCertificates()
      // Pre-llenar Unidad Organizacional si está en el perfil del usuario
      setGenerateCertOrgUnit(session.user.user_metadata?.department || "General")
    }
  }, [session])

  const fetchUserCertificates = async () => {
    if (!supabase || !session?.user) return
    setIsProcessing(true)
    // Podríamos seleccionar más campos aquí si los añadimos a la tabla user_certificates
    const { data, error: fetchError } = await supabase
      .from("user_certificates")
      .select("id, certificate_name, created_at, cert_common_name, cert_organizational_unit, cert_fingerprint_sha256")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      setError(`Error al cargar certificados: ${fetchError.message}`)
    } else {
      setUserCertificates(data || [])
      if (data && data.length > 0 && !selectedCertificateId) {
        setSelectedCertificateId(data[0].id)
      } else if (data && data.length === 0) {
        setSelectedCertificateId("")
      }
    }
    setIsProcessing(false)
  }

  const handleMainPdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setPdfFile(file)
      if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl)
      setCurrentPdfUrl(URL.createObjectURL(file))
      setVerificationResults(null)
      setError(null)
      setSuccessMessage(null)
    } else {
      setPdfFile(null)
      setCurrentPdfUrl(null)
      setError("Por favor, selecciona un archivo PDF válido.")
    }
  }

  const handleCertificateUpload = async () => {
    if (!certificateFile || !privateKeyFile || !uploadCertificateName) {
      setError("Nombre, archivo de certificado (.pem/.crt) y clave privada (.pem/.key) son requeridos.")
      return
    }
    setIsProcessing(true)
    setError(null)
    setSuccessMessage(null)
    const formData = new FormData()
    formData.append("certificate", certificateFile)
    formData.append("privateKey", privateKeyFile)
    formData.append("certificateName", uploadCertificateName)

    try {
      const response = await fetch("/api/upload-certificate", { method: "POST", body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Error al subir certificado.")
      setSuccessMessage(result.message + ` ID: ${result.certificate.id}`)
      setCertificateFile(null)
      setPrivateKeyFile(null)
      setUploadCertificateName("")
      await fetchUserCertificates()
      if (result.certificate?.id) setSelectedCertificateId(result.certificate.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateCertificate = async () => {
    if (!generateCertNamePrefix || !generateCertOrgUnit) {
      // Validar nuevo campo
      setError("Prefijo para nombre y Unidad Organizacional son requeridos.")
      return
    }
    setIsProcessing(true)
    setError(null)
    setSuccessMessage(null)
    setIsGenerateDialogOpen(false)

    try {
      const response = await fetch("/api/generate-user-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificate_name_prefix: generateCertNamePrefix,
          days_valid: generateCertDaysValid,
          organizational_unit_name_input: generateCertOrgUnit, // Enviar nuevo campo
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Error al generar certificado.")
      setSuccessMessage(result.message + ` ID: ${result.certificate.id}`)
      await fetchUserCertificates()
      if (result.certificate?.id) setSelectedCertificateId(result.certificate.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSignDocument = async () => {
    if (!pdfFile || !selectedCertificateId) {
      setError("Sube un PDF y selecciona un certificado para firmar.")
      return
    }
    setIsProcessing(true)
    setError(null)
    setSuccessMessage(null)
    setVerificationResults(null)
    const formData = new FormData()
    formData.append("pdf", pdfFile)
    formData.append("certificateId", selectedCertificateId)
    formData.append("reason", signReason)

    try {
      const response = await fetch("/api/sign-with-user-cert", { method: "POST", body: formData })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al firmar.")
      }
      const signedPdfBlob = await response.blob()
      const newPdfFile = new File([signedPdfBlob], pdfFile.name, { type: "application/pdf" })
      setPdfFile(newPdfFile)
      if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl)
      setCurrentPdfUrl(URL.createObjectURL(signedPdfBlob))
      setSuccessMessage("Documento firmado. Puedes verificarlo o aplicar más firmas.")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVerifySignatures = async () => {
    if (!pdfFile) {
      setError("Sube o firma un documento primero para verificarlo.")
      return
    }
    setIsProcessing(true)
    setError(null)
    setSuccessMessage(null)
    const formData = new FormData()
    formData.append("pdf", pdfFile)

    try {
      const response = await fetch("/api/verify-professional-signatures", { method: "POST", body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Error al verificar firmas.")
      setVerificationResults(result.verification_results || [])
      setSuccessMessage(
        result.verification_results?.length > 0
          ? "Verificación completada."
          : "Verificación completada. No se encontraron firmas.",
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Suite de Firma Digital Profesional</h1>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert>
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="ml-4 text-lg">Procesando...</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <KeyRound className="mr-2 h-5 w-5" />
              Gestionar Certificados
            </CardTitle>
            <CardDescription>Sube o genera certificados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generar Nuevo Certificado
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generar Certificado Autofirmado</DialogTitle>
                  <DialogDescription>Se usará tu info de perfil. Ideal para uso interno.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="gen-cert-name">Prefijo Nombre Certificado</Label>
                    <Input
                      id="gen-cert-name"
                      value={generateCertNamePrefix}
                      onChange={(e) => setGenerateCertNamePrefix(e.target.value)}
                      placeholder="Ej: Mi Certificado"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gen-cert-org-unit">Unidad Organizacional (Área)</Label>
                    <Input
                      id="gen-cert-org-unit"
                      value={generateCertOrgUnit}
                      onChange={(e) => setGenerateCertOrgUnit(e.target.value)}
                      placeholder="Ej: Tecnología, Humanidades"
                    />
                  </div>{" "}
                  {/* Nuevo Input */}
                  <div>
                    <Label htmlFor="gen-cert-days">Días de Validez</Label>
                    <Input
                      id="gen-cert-days"
                      type="number"
                      value={generateCertDaysValid}
                      onChange={(e) => setGenerateCertDaysValid(Number.parseInt(e.target.value, 10) || 365)}
                      min="30"
                      max="3650"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleGenerateCertificate}
                    disabled={isProcessing || !generateCertNamePrefix || !generateCertOrgUnit}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar y Guardar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <p className="text-sm text-muted-foreground text-center my-2">ó</p>
            <div className="space-y-2">
              <Label htmlFor="upload-cert-name">Nombre Certificado (al subir)</Label>
              <Input
                id="upload-cert-name"
                value={uploadCertificateName}
                onChange={(e) => setUploadCertificateName(e.target.value)}
                placeholder="Nombre descriptivo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-file">Archivo Certificado (.pem, .crt)</Label>
              <Input
                id="cert-file"
                type="file"
                accept=".pem,.crt"
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-file">Archivo Clave Privada (.pem, .key)</Label>
              <Input
                id="key-file"
                type="file"
                accept=".pem,.key"
                onChange={(e) => setPrivateKeyFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              onClick={handleCertificateUpload}
              disabled={isProcessing || !certificateFile || !privateKeyFile || !uploadCertificateName}
              className="w-full"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Subir Certificado Existente
            </Button>
          </CardContent>
          {userCertificates.length > 0 && (
            <CardContent className="mt-4 border-t pt-4">
              <h3 className="text-md font-semibold mb-2">Mis Certificados:</h3>
              <Select value={selectedCertificateId} onValueChange={setSelectedCertificateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un certificado" />
                </SelectTrigger>
                <SelectContent>
                  {userCertificates.map((cert) => (
                    <SelectItem key={cert.id} value={cert.id}>
                      {cert.certificate_name}
                      {cert.cert_common_name && (
                        <span className="text-xs text-muted-foreground ml-2">({cert.cert_common_name})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCertificateId &&
                userCertificates.find((c) => c.id === selectedCertificateId)?.cert_organizational_unit && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Área: {userCertificates.find((c) => c.id === selectedCertificateId)?.cert_organizational_unit}
                  </p>
                )}
              {selectedCertificateId &&
                userCertificates.find((c) => c.id === selectedCertificateId)?.cert_fingerprint_sha256 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Huella:{" "}
                    <span className="font-mono break-all">
                      {userCertificates
                        .find((c) => c.id === selectedCertificateId)
                        ?.cert_fingerprint_sha256?.substring(0, 16)}
                      ...
                    </span>
                  </p>
                )}
            </CardContent>
          )}
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSignature className="mr-2 h-5 w-5" />
                Operaciones con PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pdf-upload-main">1. Sube PDF de trabajo</Label>
                <Input id="pdf-upload-main" type="file" accept="application/pdf" onChange={handleMainPdfFileChange} />
              </div>
              {pdfFile && userCertificates.length > 0 && selectedCertificateId && (
                <>
                  <div>
                    <Label htmlFor="sign-reason">2. Motivo Firma (opcional)</Label>
                    <Textarea
                      id="sign-reason"
                      value={signReason}
                      onChange={(e) => setSignReason(e.target.value)}
                      placeholder="Ej: Revisado y aprobado"
                    />
                  </div>
                  <Button
                    onClick={handleSignDocument}
                    disabled={isProcessing || !selectedCertificateId}
                    className="w-full"
                  >
                    <FileSignature className="mr-2 h-4 w-4" />
                    Firmar con "
                    {userCertificates.find((c) => c.id === selectedCertificateId)?.certificate_name || "seleccionado"}"
                  </Button>
                </>
              )}
              {pdfFile && (userCertificates.length === 0 || !selectedCertificateId) && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {userCertificates.length === 0 ? "Genera/sube un certificado." : "Selecciona un certificado."}
                  </AlertDescription>
                </Alert>
              )}
              <Button onClick={handleVerifySignatures} disabled={isProcessing || !pdfFile} className="w-full">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verificar Firmas del PDF
              </Button>
            </CardContent>
          </Card>
          {currentPdfUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <iframe src={currentPdfUrl} className="w-full h-[700px] border rounded-md" title="PDF Preview"></iframe>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {verificationResults && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheck className="mr-2 h-5 w-5" />
              Resultados Verificación
            </CardTitle>
            <CardDescription>Se encontraron {verificationResults.length} firma(s).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationResults.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>No se encontraron firmas.</AlertDescription>
              </Alert>
            )}
            {verificationResults.map((sig) => (
              <Card
                key={sig.signature_index}
                className={sig.valid && sig.intact ? "border-green-500" : "border-red-500"}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>
                      Firma #{sig.signature_index + 1}: {sig.certificate_details.signer_name_from_cert}
                    </span>
                    <Badge variant={sig.valid && sig.intact ? "secondary" : "destructive"}>
                      {sig.valid && sig.intact ? "VÁLIDA" : sig.error ? "ERROR" : "INVÁLIDA"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Campo: {sig.signer_name_field}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-xs">
                  <p>
                    <strong>Firmante (Cert):</strong> {sig.certificate_details.signer_name_from_cert} (
                    {sig.certificate_details.signer_email})
                  </p>
                  <p>
                    <strong>Organización (Cert):</strong> {sig.certificate_details.signer_org} (
                    {sig.certificate_details.signer_org_unit}, {sig.certificate_details.signer_country})
                  </p>
                  <p>
                    <strong>Hora Firma:</strong> {sig.signing_time}
                  </p>
                  <p>
                    <strong>Motivo:</strong> {sig.reason}
                  </p>
                  <p>
                    <strong>Huella SHA256 (Cert):</strong>{" "}
                    <span className="font-mono break-all">{sig.certificate_details.fingerprint_sha256}</span>
                  </p>
                  <p>
                    <strong>Validez Cert:</strong> {format(new Date(sig.certificate_details.valid_from), "dd/MM/yy")} -{" "}
                    {format(new Date(sig.certificate_details.valid_to), "dd/MM/yy")}
                  </p>
                  <p>
                    <strong>Emisor (Cert):</strong> {sig.certificate_details.issuer_name}
                  </p>
                  <p className="text-xs mt-2 pt-2 border-t">
                    <strong>Resumen Técnico:</strong> {sig.summary}
                  </p>
                  {sig.error && (
                    <p className="text-red-600">
                      <strong>Error:</strong> {sig.error}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
