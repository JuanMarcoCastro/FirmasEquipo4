"use client"

import type React from "react"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { PlusCircle, Pencil, Trash2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Department = {
  id: string
  name: string
  description: string
  active: boolean
}

export default function DepartmentSettings() {
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([
    { id: "1", name: "Humanitaria", description: "Área de ayuda humanitaria", active: true },
    { id: "2", name: "Psicosocial", description: "Área de atención psicosocial", active: true },
    { id: "3", name: "Legal", description: "Área de asesoría legal", active: true },
    { id: "4", name: "Comunicación", description: "Área de comunicación", active: true },
    { id: "5", name: "Almacén", description: "Área de almacén y logística", active: true },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }))
  }

  const openNewDepartmentDialog = () => {
    setCurrentDepartment(null)
    setFormData({
      name: "",
      description: "",
      active: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDepartmentDialog = (department: Department) => {
    setCurrentDepartment(department)
    setFormData({
      name: department.name,
      description: department.description,
      active: department.active,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Aquí iría la lógica para guardar en Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (currentDepartment) {
        // Actualizar departamento existente
        setDepartments((prev) =>
          prev.map((dept) => (dept.id === currentDepartment.id ? { ...dept, ...formData } : dept)),
        )

        toast({
          title: "Departamento actualizado",
          description: `El departamento "${formData.name}" ha sido actualizado.`,
        })
      } else {
        // Crear nuevo departamento
        const newDepartment: Department = {
          id: Date.now().toString(),
          ...formData,
        }

        setDepartments((prev) => [...prev, newDepartment])

        toast({
          title: "Departamento creado",
          description: `El departamento "${formData.name}" ha sido creado.`,
        })
      }

      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el departamento. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este departamento? Esta acción no se puede deshacer.")) {
      return
    }

    setIsLoading(true)

    try {
      // Aquí iría la lógica para eliminar en Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const departmentToDelete = departments.find((dept) => dept.id === id)
      setDepartments((prev) => prev.filter((dept) => dept.id !== id))

      toast({
        title: "Departamento eliminado",
        description: `El departamento "${departmentToDelete?.name}" ha sido eliminado.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el departamento. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Departamentos</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDepartmentDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentDepartment ? "Editar Departamento" : "Nuevo Departamento"}</DialogTitle>
              <DialogDescription>
                {currentDepartment
                  ? "Actualice la información del departamento."
                  : "Complete la información para crear un nuevo departamento."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Departamento</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleChange} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="active" checked={formData.active} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="active">Activo</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {departments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay departamentos configurados.</div>
      ) : (
        <div className="border rounded-md">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Nombre</th>
                <th className="text-left p-3 font-medium">Descripción</th>
                <th className="text-center p-3 font-medium">Estado</th>
                <th className="text-right p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id} className="border-b last:border-0">
                  <td className="p-3">{dept.name}</td>
                  <td className="p-3">{dept.description}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${dept.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {dept.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDepartmentDialog(dept)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(dept.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription>
          Eliminar un departamento puede afectar a los usuarios y documentos asociados a él. Considere desactivar el
          departamento en lugar de eliminarlo.
        </AlertDescription>
      </Alert>
    </div>
  )
}
