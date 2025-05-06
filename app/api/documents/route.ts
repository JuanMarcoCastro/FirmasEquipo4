import { NextResponse } from "next/server"
import { mockFiles } from "@/lib/mock-data"

export async function GET() {
  // Simulamos un retraso de red
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json({ files: mockFiles })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    // En una implementación real, aquí subiríamos el archivo a un almacenamiento
    // y lo procesaríamos para su firma digital

    // Simulamos la creación de un nuevo archivo
    const newFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      type: file.type,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      date: new Date().toISOString().split("T")[0],
      signed: false,
      pendingSignature: [],
    }

    return NextResponse.json({
      file: newFile,
      message: "Archivo subido correctamente",
    })
  } catch (error) {
    console.error("Error al subir archivo:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
