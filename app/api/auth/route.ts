import { NextResponse } from "next/server"
import { mockUsers } from "@/lib/mock-data"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // En una implementación real, verificaríamos contra la base de datos
    // y usaríamos hashing para las contraseñas
    const user = mockUsers.find((user) => user.email === email)

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 })
    }

    // Simulamos verificación de contraseña
    // En producción, usaríamos bcrypt o similar
    if (password !== "password") {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
    }

    // Simulamos un token JWT
    const token = `mock-jwt-token-${user.id}-${Date.now()}`

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    })
  } catch (error) {
    console.error("Error en autenticación:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
