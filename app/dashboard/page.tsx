"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Folder, File, FileSignature, Upload, Users, Settings } from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import FolderView from "@/components/folder-view"
import { mockFolders } from "@/lib/mock-data"

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentFolder, setCurrentFolder] = useState(mockFolders[0])

  const pendingSignatures = 3

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Gestiona tus documentos y firmas digitales</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/pending">
              <Button variant="outline" size="sm">
                <FileSignature className="h-4 w-4 mr-2" />
                Firmas Pendientes
                {pendingSignatures > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingSignatures}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Documentos</CardTitle>
              <CardDescription>Total de documentos en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <File className="h-8 w-8 text-primary mr-2" />
                <span className="text-3xl font-bold">24</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pendientes de Firma</CardTitle>
              <CardDescription>Documentos que requieren tu firma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileSignature className="h-8 w-8 text-destructive mr-2" />
                <span className="text-3xl font-bold">{pendingSignatures}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Carpetas</CardTitle>
              <CardDescription>Organización de documentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Folder className="h-8 w-8 text-primary mr-2" />
                <span className="text-3xl font-bold">{mockFolders.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-1/3">
            <Input
              placeholder="Buscar documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Subir Documento
            </Button>
            <Button variant="outline">
              <Folder className="h-4 w-4 mr-2" />
              Nueva Carpeta
            </Button>
            <Link href="/dashboard/users">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Usuarios
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="folders">
          <TabsList>
            <TabsTrigger value="folders">Carpetas</TabsTrigger>
            <TabsTrigger value="recent">Recientes</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="signed">Firmados</TabsTrigger>
          </TabsList>

          <TabsContent value="folders" className="mt-4">
            <FolderView folders={mockFolders} currentFolder={currentFolder} onFolderSelect={setCurrentFolder} />
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">Aquí se mostrarán los documentos recientes</div>
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              Aquí se mostrarán los documentos pendientes de firma
            </div>
          </TabsContent>

          <TabsContent value="signed" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">Aquí se mostrarán los documentos firmados</div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
