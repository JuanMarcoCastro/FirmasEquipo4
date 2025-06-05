"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Calendar, User, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface SignedDocument {
  id: string
  original_document_id: string
  signed_file_path: string
  signed_at: string
  signature_data: any
  documents: {
    title: string
    description: string
    file_path: string
    created_at: string
    users: {
      full_name: string
      email: string
    }
  }
}

export default function SignedDocumentsPage() {
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSignedDocuments() {
      try {
        // Obtener usuario actual
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        if (!currentUser) return

        setUser(currentUser)

        // Obtener documentos firmados por el usuario actual
        const { data, error } = await supabase
          .from("signed_documents")
          .select(`
            id,
            original_document_id,
            signed_file_path,
            signed_at,
            signature_data,
            documents (
              title,
              description,
              file_path,
              created_at,
              users (
                full_name,
                email
              )
            )
          `)
          .eq("signer_id", currentUser.id)
          .order("signed_at", { ascending: false })

        if (error) {
          console.error("Error loading signed documents:", error)
        } else {
          setSignedDocuments(data || [])
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSignedDocuments()
  }, [supabase])

  const downloadSignedDocument = async (signedDocument: SignedDocument) => {
    try {
      const { data, error } = await supabase.storage.from("signed_documents").download(signedDocument.signed_file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = `${signedDocument.documents.title}_firmado.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading signed document:", error)
      alert("Error al descargar el documento firmado")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando documentos firmados...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Documentos Firmados</h1>
        <p className="text-gray-600">Aquí puedes ver y descargar todos los documentos que has firmado digitalmente.</p>
      </div>

      {signedDocuments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">No has firmado documentos aún</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Cuando firmes documentos digitalmente, aparecerán aquí para que puedas descargarlos y consultarlos
                cuando necesites.
              </p>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => (window.location.href = "/sign-documents")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver documentos para firmar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {signedDocuments.map((signedDoc) => (
            <Card key={signedDoc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      {signedDoc.documents.title}
                    </CardTitle>
                    <CardDescription>{signedDoc.documents.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Firmado
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Firmado el {format(new Date(signedDoc.signed_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Creado por {signedDoc.documents.users.full_name}</span>
                  </div>
                </div>

                {signedDoc.signature_data && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Información de la firma:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      {signedDoc.signature_data.position && (
                        <p>
                          Posición: Página {signedDoc.signature_data.position.page}, X:{" "}
                          {signedDoc.signature_data.position.x}, Y: {signedDoc.signature_data.position.y}
                        </p>
                      )}
                      {signedDoc.signature_data.reason && <p>Motivo: {signedDoc.signature_data.reason}</p>}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => downloadSignedDocument(signedDoc)} className="bg-blue-600 hover:bg-blue-700">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar documento firmado
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
