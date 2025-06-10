"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Download, Search, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type LogEntry = {
  id: string
  timestamp: string
  level: "info" | "warning" | "error"
  message: string
  user: string
  action: string
  details?: string
}

export default function SystemLogs() {
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("all")

  // Datos de ejemplo para los logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "1",
      timestamp: "2023-06-05T10:15:30",
      level: "info",
      message: "Usuario inició sesión",
      user: "admin@casamonarca.org",
      action: "LOGIN",
    },
    {
      id: "2",
      timestamp: "2023-06-05T11:20:45",
      level: "info",
      message: "Documento subido",
      user: "coordinador@casamonarca.org",
      action: "DOCUMENT_UPLOAD",
      details: "documento_legal_001.pdf",
    },
    {
      id: "3",
      timestamp: "2023-06-05T12:30:15",
      level: "warning",
      message: "Intento de acceso no autorizado",
      user: "usuario@externo.com",
      action: "UNAUTHORIZED_ACCESS",
      details: "Intento de acceso a /dashboard/admin",
    },
    {
      id: "4",
      timestamp: "2023-06-05T14:45:22",
      level: "error",
      message: "Error en la firma de documento",
      user: "operativo@casamonarca.org",
      action: "SIGNATURE_ERROR",
      details: "Error: Certificate not found",
    },
    {
      id: "5",
      timestamp: "2023-06-05T15:10:05",
      level: "info",
      message: "Documento firmado exitosamente",
      user: "externo@empresa.com",
      action: "DOCUMENT_SIGNED",
      details: "contrato_colaboracion.pdf",
    },
  ])

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesLevel = levelFilter === "all" || log.level === levelFilter

    return matchesSearch && matchesLevel
  })

  const handleExportLogs = () => {
    setIsLoading(true)

    try {
      // Convertir logs a CSV
      const headers = ["Timestamp", "Level", "Message", "User", "Action", "Details"]
      const csvContent = [
        headers.join(","),
        ...filteredLogs.map((log) =>
          [
            log.timestamp,
            log.level,
            `"${log.message}"`,
            log.user,
            log.action,
            log.details ? `"${log.details}"` : "",
          ].join(","),
        ),
      ].join("\n")

      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `system_logs_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Logs exportados",
        description: "Los logs han sido exportados exitosamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron exportar los logs. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearLogs = () => {
    if (!confirm("¿Está seguro de eliminar todos los logs? Esta acción no se puede deshacer.")) {
      return
    }

    setIsLoading(true)

    try {
      // Aquí iría la lógica para limpiar logs en Supabase
      setTimeout(() => {
        setLogs([])

        toast({
          title: "Logs eliminados",
          description: "Todos los logs han sido eliminados exitosamente.",
        })

        setIsLoading(false)
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar los logs. Intente nuevamente.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "info":
        return "bg-blue-100 text-blue-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportLogs} disabled={isLoading || filteredLogs.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleClearLogs} disabled={isLoading || logs.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar Logs
          </Button>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay logs disponibles.</div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Timestamp</th>
                  <th className="text-left p-3 font-medium">Nivel</th>
                  <th className="text-left p-3 font-medium">Mensaje</th>
                  <th className="text-left p-3 font-medium">Usuario</th>
                  <th className="text-left p-3 font-medium">Acción</th>
                  <th className="text-left p-3 font-medium">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="p-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getLevelBadgeClass(log.level)}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="p-3">{log.message}</td>
                    <td className="p-3">{log.user}</td>
                    <td className="p-3">{log.action}</td>
                    <td className="p-3">{log.details || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Retención de logs</AlertTitle>
          <AlertDescription>
            Los logs se mantienen por 30 días. Exporte los logs importantes antes de que sean eliminados
            automáticamente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
