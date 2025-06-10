"use client"

import { useState, type FormEvent, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabase } from "@/lib/supabase-provider"
import { departments } from "@/lib/rbac"

interface DocumentUploadButtonProps {
  userId: string
  className?: string
}

export default function DocumentUploadButton({ userId, className }: DocumentUploadButtonProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [requiredSignatures, setRequiredSignatures] = useState(1)
  const [targetDepartment, setTargetDepartment] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!title || title.length < 3) {
      newErrors.title = "El título debe tener al menos 3 caracteres"
    }

    if (!file) {
      newErrors.file = "Debes seleccionar un archivo PDF"
    } else if (file.type !== "application/pdf") {
      newErrors.file = "Solo se permiten archivos PDF"
    }

    if (requiredSignatures < 1) {
      newErrors.requiredSignatures = "Debe requerir al menos 1 firma"
    } else if (requiredSignatures > 10) {
      newErrors.requiredSignatures = "Máximo 10 firmas"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setFile(null)
    setRequiredSignatures(1)
    setTargetDepartment("")
    setErrors({})
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      if (!file) {
        throw new Error("No se ha seleccionado ningún archivo")
      }

      // Upload file to Supabase Storage with user folder structure
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw new Error("Error al subir el archivo: " + uploadError.message)
      }

      // Create document record
      const { data: document, error: documentError } = await supabase
        .from("documents")
        .insert({
          title,
          description: description || null,
          file_path: filePath,
          uploaded_by: userId,
          requires_signatures: requiredSignatures,
          status: "pending",
        })
        .select()
        .single()

      if (documentError) {
        console.error("Document creation error:", documentError)
        throw new Error("Error al crear el documento: " + documentError.message)
      }

      toast({
        title: "Documento subido exitosamente",
        description: "El documento ha sido subido y está listo para asignar firmas.",
      })

      setIsOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        variant: "destructive",
        title: "Error al subir documento",
        description: error.message || "Ocurrió un error al subir el documento",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className={className} type="button">
        <Upload className="mr-2 h-4 w-4" />
        Subir Documento
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Subir Nuevo Documento</DialogTitle>
            <DialogDescription>Sube un documento PDF para que pueda ser firmado digitalmente.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del documento</Label>
              <Input
                id="title"
                placeholder="Ej: Contrato de servicios"
                disabled={isLoading}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descripción del documento..."
                disabled={isLoading}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Archivo PDF</Label>
              <Input id="file" type="file" accept=".pdf" disabled={isLoading} onChange={handleFileChange} />
              {errors.file && <p className="text-sm text-red-500">{errors.file}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredSignatures">Número de firmas requeridas</Label>
              <Input
                id="requiredSignatures"
                type="number"
                min={1}
                max={10}
                disabled={isLoading}
                value={requiredSignatures}
                onChange={(e) => setRequiredSignatures(Number.parseInt(e.target.value) || 1)}
              />
              {errors.requiredSignatures && <p className="text-sm text-red-500">{errors.requiredSignatures}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDepartment">Departamento objetivo (opcional)</Label>
              <Select value={targetDepartment} onValueChange={setTargetDepartment} disabled={isLoading}>
                <SelectTrigger id="targetDepartment">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false)
                  resetForm()
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
