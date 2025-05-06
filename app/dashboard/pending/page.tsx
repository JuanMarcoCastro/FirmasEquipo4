"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileSignature, Eye, Download, MoreVertical, Search } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { mockFiles } from "@/lib/mock-data"

export default function PendingSignaturesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Filtrar archivos pendientes de firma
  const pendingFiles = mockFiles.filter((file) => !file.signed)

  // Filtrar por búsqueda
  const filteredFiles = pendingFiles.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Firmas Pendientes</h1>
            <p className="text-muted-foreground">Documentos que requieren tu firma</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Documentos Pendientes</CardTitle>
            <CardDescription>Documentos que están esperando tu firma digital</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentos..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredFiles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead>Solicitado por</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">{file.name}</TableCell>
                      <TableCell>{file.date}</TableCell>
                      <TableCell>{file.size}</TableCell>
                      <TableCell>
                        {file.pendingSignature && file.pendingSignature[0] ? file.pendingSignature[0].name : "Sistema"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <FileSignature className="h-4 w-4 mr-2" />
                              Firmar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Documento
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Descargar
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
                <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-medium">No hay documentos pendientes de firma</h3>
                <p className="text-sm text-muted-foreground">
                  Cuando alguien solicite tu firma, los documentos aparecerán aquí
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
