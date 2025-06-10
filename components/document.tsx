"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, FileSignature, Download, Settings } from "lucide-react"
import Link from "next/link"

interface DocumentProps {
  documentId: string
  isReadOnly?: boolean
}

export function Document({ documentId, isReadOnly = false }: DocumentProps) {
  const [document, setDocument] = useState({
    id: documentId,
    title: "Documento de ejemplo",
    description: "Este es un documento de ejemplo para visualización",
    status: "pending",
    created_at: new Date().toISOString(),
    signatures_required: 3,
    signatures_count: 1,
    file_size: "1.2 MB",
  })

  // Función para formatear fechas en español
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Determinar el color del badge según el estado
  const getStatusBadge = () => {
    switch (document.status) {
      case "draft":
        return <Badge variant="outline">Borrador</Badge>
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>
      case "signed":
        return <Badge variant="success">Firmado</Badge>
      case "archived":
        return <Badge variant="destructive">Archivado</Badge>
      default:
        return <Badge variant="outline">{document.status}</Badge>
    }
  }

  // Calcular el progreso de firmas
  const signatureProgress = Math.round((document.signatures_count / document.signatures_required) * 100)

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{document.title}</CardTitle>
            <CardDescription className="mt-1">{document.description}</CardDescription>
          </div>
          <div>{getStatusBadge()}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <div className="text-sm text-muted-foreground">Creado el {formatDate(document.created_at)}</div>
            <div className="text-sm text-muted-foreground">Tamaño: {document.file_size}</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Firmas: {document.signatures_count} de {document.signatures_required}
              </span>
              <span>{signatureProgress}%</span>
            </div>
            <Progress value={signatureProgress} className="h-2" />
          </div>
        </div>
      </CardContent>
      {!isReadOnly && (
        <CardFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/documents/${document.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/sign/${document.id}`}>
                <FileSignature className="mr-2 h-4 w-4" />
                Firmar
              </Link>
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/documents/${document.id}/manage`}>
                <Settings className="mr-2 h-4 w-4" />
                Gestionar
              </Link>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
