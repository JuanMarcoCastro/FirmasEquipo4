"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PDFDocument, StandardFonts } from "pdf-lib"
import { FileSignature, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import SignaturePad from "@/components/documents/signature-pad"
import CertificateSelector from "@/components/documents/certificate-selector"

interface DocumentSigningFormProps {
  documentId: string
  userId: string
  documentUrl: string
}

type SignaturePosition = {
  pageNumber: number
  x: number
  y: number
} | null

export default function DocumentSigningForm({ documentId, userId, documentUrl }: DocumentSigningFormProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<"signature" | "certificate" | "reason" | "processing">("signature")
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition>({
    pageNumber: 1,
    x: 100,
    y: 100,
  })
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null)
  const [certificatePassword, setCertificatePassword] = useState<string | null>(null)
  const [signatureReason, setSignatureReason] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl)
    setStep("certificate")
  }

  const handleCertificateSelect = (certificateId: string, password: string) => {
    setSelectedCertificateId(certificateId)
    setCertificatePassword(password)
    setStep("reason")
  }

  const handleSignDocument = async () => {
    if (!signatureDataUrl || !selectedCertificateId) {
      toast({
        variant: "destructive",
        title: "Error al firmar",
        description: "Faltan datos para completar la firma",
      })
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // In a real app, we would use the certificate and password to sign the PDF
      // Here we'll simulate the signing process with pdf-lib

      // 1. Download the PDF
      const pdfBytes = await fetch(documentUrl).then((res) => res.arrayBuffer())

      // 2. Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes)

      // 3. Get the page
      const pages = pdfDoc.getPages()
      const pageIndex = Math.min(signaturePosition?.pageNumber ? signaturePosition.pageNumber - 1 : 0, pages.length - 1)
      const page = pages[pageIndex]

      // 4. Convert signature image to bytes
      const signatureImageBytes = await fetch(signatureDataUrl).then((res) => res.arrayBuffer())

      // 5. Embed the signature image
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes)

      // 6. Calculate dimensions and position
      const { width, height } = page.getSize()
      const signatureDims = signatureImage.scale(0.3) // Scale down the signature

      // 7. Draw the signature on the page
      const x = signaturePosition?.x || width / 2 - signatureDims.width / 2
      const y = signaturePosition?.y
        ? height - signaturePosition.y - signatureDims.height
        : height / 2 - signatureDims.height / 2

      page.drawImage(signatureImage, {
        x,
        y,
        width: signatureDims.width,
        height: signatureDims.height,
      })

      // 8. Add signature text
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      page.drawText(`Firmado por: ${userId}`, {
        x,
        y: y - 20,
        size: 10,
        font,
      })

      page.drawText(`Fecha: ${new Date().toLocaleString()}`, {
        x,
        y: y - 35,
        size: 10,
        font,
      })

      if (signatureReason) {
        page.drawText(`Motivo: ${signatureReason}`, {
          x,
          y: y - 50,
          size: 10,
          font,
        })
      }

      // 9. Save the PDF
      const signedPdfBytes = await pdfDoc.save()

      // 10. Upload the signed PDF
      const signedFileName = `signed_${documentId}_${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage
        .from("signed_documents")
        .upload(signedFileName, signedPdfBytes)

      if (uploadError) {
        throw uploadError
      }

      // 11. Create signature record in database
      const { error: signatureError } = await supabase.from("signatures").insert({
        document_id: documentId,
        user_id: userId,
        certificate_id: selectedCertificateId,
        signature_position: {
          page: signaturePosition?.pageNumber || 1,
          x: signaturePosition?.x || width / 2,
          y: signaturePosition?.y || height / 2,
        },
        signature_reason: signatureReason,
        signature_hash: "simulated-hash-" + Date.now(), // In a real app, this would be a cryptographic hash
      })

      if (signatureError) {
        throw signatureError
      }

      // 12. Update document signature count
      const { error: updateError } = await supabase.rpc("increment_signature_count", {
        doc_id: documentId,
      })

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Documento firmado exitosamente",
        description: "El documento ha sido firmado y guardado correctamente.",
      })

      router.push(`/dashboard/documents/${documentId}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error signing document:", error)
      setError(error.message || "Ocurrió un error al procesar la firma")
      setIsProcessing(false)

      toast({
        variant: "destructive",
        title: "Error al firmar el documento",
        description: error.message || "Ocurrió un error al procesar la firma",
      })
    }
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-lg font-medium">Procesando firma...</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Estamos aplicando tu firma al documento. Por favor, espera un momento.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={() => setError(null)}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {step === "signature" && (
        <>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Paso 1: Dibuja tu firma</h3>
            <p className="text-sm text-muted-foreground">Utiliza el panel a continuación para dibujar tu firma.</p>
          </div>
          <SignaturePad onSave={handleSignatureSave} onCancel={() => router.back()} />
        </>
      )}

      {step === "certificate" && (
        <>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Paso 2: Selecciona tu certificado digital</h3>
            <p className="text-sm text-muted-foreground">
              Elige el certificado que deseas utilizar para firmar este documento.
            </p>
          </div>
          <CertificateSelector
            userId={userId}
            onSelect={handleCertificateSelect}
            onCancel={() => setStep("signature")}
          />
        </>
      )}

      {step === "reason" && (
        <>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Paso 3: Motivo de la firma</h3>
            <p className="text-sm text-muted-foreground">Indica el motivo por el cual estás firmando este documento.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo de la firma (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Ej: Aprobación del documento, Revisión completada, etc."
                value={signatureReason}
                onChange={(e) => setSignatureReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStep("certificate")}>
                Atrás
              </Button>
              <Button onClick={handleSignDocument}>
                <FileSignature className="mr-2 h-4 w-4" />
                Firmar Documento
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
