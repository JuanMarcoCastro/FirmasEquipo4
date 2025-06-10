"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSupabase } from "@/lib/supabase-provider"

interface DocumentDeleteButtonProps {
  documentId: string
}

export default function DocumentDeleteButton({ documentId }: DocumentDeleteButtonProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      // Get document info to delete file from storage
      const { data: document, error: fetchError } = await supabase
        .from("documents")
        .select("file_path")
        .eq("id", documentId)
        .single()

      if (fetchError) {
        console.error("Error fetching document:", fetchError)
        throw new Error("Error al obtener información del documento")
      }

      // Delete document record
      const { error: deleteError } = await supabase.from("documents").delete().eq("id", documentId)

      if (deleteError) {
        console.error("Error deleting document:", deleteError)
        throw new Error("Error al eliminar el documento: " + deleteError.message)
      }

      // Delete file from storage
      if (document?.file_path) {
        const { error: storageError } = await supabase.storage.from("documents").remove([document.file_path])
        if (storageError) {
          console.error("Error deleting file:", storageError)
          // Don't throw here, just log the error
        }
      }

      toast({
        title: "Documento eliminado",
        description: "El documento ha sido eliminado correctamente.",
      })

      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error("Delete error:", error)
      toast({
        variant: "destructive",
        title: "Error al eliminar documento",
        description: error.message || "Ocurrió un error al eliminar el documento",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setIsOpen(true)}>
        <Trash2 className="h-4 w-4 text-red-500" />
        <span className="sr-only">Eliminar documento</span>
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
