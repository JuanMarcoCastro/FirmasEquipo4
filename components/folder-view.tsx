"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Folder, File, MoreVertical, FileSignature, Download, Trash, Share, Eye } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import type { Folder as FolderType, File as FileType } from "@/lib/types"

interface FolderViewProps {
  folders: FolderType[]
  currentFolder: FolderType
  onFolderSelect: (folder: FolderType) => void
}

export default function FolderView({ folders, currentFolder, onFolderSelect }: FolderViewProps) {
  const [showSignDialog, setShowSignDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null)

  const handleSignFile = (file: FileType) => {
    setSelectedFile(file)
    setShowSignDialog(true)
  }

  const handleSignSubmit = async () => {
    // En una implementación real, esto enviaría la solicitud al backend
    console.log("Firmando archivo:", selectedFile)
    setShowSignDialog(false)

    // Simular una notificación por correo
    console.log("Enviando notificación por correo...")
  }

  const getBreadcrumbPath = () => {
    // En una implementación real, esto construiría la ruta completa
    return [
      { name: "Inicio", id: "root" },
      { name: currentFolder.name, id: currentFolder.id },
    ]
  }

  const breadcrumbPath = getBreadcrumbPath()

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbPath.map((item, index) => (
            <>
              <BreadcrumbItem key={`item-${item.id}`}>
                <BreadcrumbLink href="#" onClick={() => index === 0 && onFolderSelect(folders[0])}>
                  {item.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {index < breadcrumbPath.length - 1 && <BreadcrumbSeparator key={`sep-${item.id}`} />}
            </>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {folders
          .filter((folder) => folder.parentId === currentFolder.id)
          .map((folder) => (
            <div
              key={folder.id}
              className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onFolderSelect(folder)}
            >
              <Folder className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-medium">{folder.name}</h3>
                <p className="text-xs text-muted-foreground">{folder.files.length} archivos</p>
              </div>
            </div>
          ))}
      </div>

      {currentFolder.files.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentFolder.files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    {file.name}
                  </div>
                </TableCell>
                <TableCell>{file.date}</TableCell>
                <TableCell>
                  {file.signed ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Firmado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendiente
                    </span>
                  )}
                </TableCell>
                <TableCell>{file.size}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSignFile(file)}>
                        <FileSignature className="h-4 w-4 mr-2" />
                        Firmar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share className="h-4 w-4 mr-2" />
                        Compartir
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 border rounded-lg">
          <File className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-medium">No hay archivos en esta carpeta</h3>
          <p className="text-sm text-muted-foreground">Sube un archivo para comenzar</p>
          <Button className="mt-4">Subir Archivo</Button>
        </div>
      )}

      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Firmar Documento</DialogTitle>
            <DialogDescription>
              Estás a punto de firmar digitalmente el documento: {selectedFile?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="signature-password">Contraseña de firma</Label>
              <Input id="signature-password" type="password" placeholder="Ingresa tu contraseña de firma" />
            </div>

            <div className="space-y-2">
              <Label>Tipo de firma</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start">
                  <FileSignature className="h-4 w-4 mr-2" />
                  Firma Simple
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileSignature className="h-4 w-4 mr-2" />
                  Firma Avanzada
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSignSubmit}>Firmar Documento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
