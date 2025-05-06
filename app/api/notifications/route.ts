import { NextResponse } from "next/server"
import { mockNotifications } from "@/lib/mock-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Se requiere ID de usuario" }, { status: 400 })
  }

  // Filtramos notificaciones por usuario
  const userNotifications = mockNotifications.filter((notification) => notification.userId === userId)

  return NextResponse.json({ notifications: userNotifications })
}

export async function POST(request: Request) {
  try {
    const { type, message, userId, documentId } = await request.json()

    if (!type || !message || !userId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // En una implementación real, aquí crearíamos la notificación
    // y enviaríamos un correo electrónico

    const newNotification = {
      id: `notif-${Date.now()}`,
      type,
      message,
      read: false,
      date: new Date().toISOString(),
      userId,
      documentId,
    }

    return NextResponse.json({
      success: true,
      notification: newNotification,
    })
  } catch (error) {
    console.error("Error al crear notificación:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
