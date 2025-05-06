"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FolderPlus } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import FolderView from "@/components/folder-view"
import { mockFolders } from "@/lib/mock-data"

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentFolder, setCurrentFolder] = useState(mockFolders[0])

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Documentos</h1>
            <p className="text-muted-foreground">Gestiona tus documentos y carpetas</p>
          </div>

          <div className="flex gap-2">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Subir Documento
            </Button>
            <Button variant="outline">
              <FolderPlus className="h-4 w-4 mr-2" />
              Nueva Carpeta
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Explorador de Documentos</CardTitle>
            <CardDescription>Navega por tus carpetas y archivos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full md:w-1/3">
                <Input
                  placeholder="Buscar documentos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <Tabs defaultValue="folders">
              <TabsList>
                <TabsTrigger value="folders">Carpetas</TabsTrigger>
                <TabsTrigger value="recent">Recientes</TabsTrigger>
                <TabsTrigger value="shared">Compartidos</TabsTrigger>
              </TabsList>

              <TabsContent value="folders" className="mt-4">
                <FolderView folders={mockFolders} currentFolder={currentFolder} onFolderSelect={setCurrentFolder} />
              </TabsContent>

              <TabsContent value="recent" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">Aquí se mostrarán los documentos recientes</div>
              </TabsContent>

              <TabsContent value="shared" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  Aquí se mostrarán los documentos compartidos contigo
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
