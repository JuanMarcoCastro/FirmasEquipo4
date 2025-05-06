"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { FileUpload } from "@/components/file-upload"
import { mockFolders } from "@/lib/mock-data"

export default function UploadDocumentPage() {
  const [selectedFolder, setSelectedFolder] = useState("1")
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string }>>([])

  const handleUploadComplete = (fileId: string, fileName: string) => {
    setUploadedFiles([...uploadedFiles, { id: fileId, name: fileName }])
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Subir Documento</h1>
            <p className="text-muted-foreground">Sube un nuevo documento al sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Subir Archivo</CardTitle>
                <CardDescription>Selecciona un archivo PDF para subir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="folder">Carpeta de Destino</Label>
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                      <SelectTrigger id="folder">
                        <SelectValue placeholder="Seleccionar carpeta" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockFolders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FileUpload onUploadComplete={handleUploadComplete} folderId={selectedFolder} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Archivos Subidos</CardTitle>
                <CardDescription>Documentos subidos recientemente</CardDescription>
              </CardHeader>
              <CardContent>
                {uploadedFiles.length > 0 ? (
                  <ul className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <li key={file.id} className="text-sm p-2 border rounded-md bg-accent/20">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay archivos subidos recientemente</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
