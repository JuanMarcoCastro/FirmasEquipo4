import { NextResponse } from "next/server"
import { mockUsers } from "@/lib/mock-data"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validaciones básicas
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Verificar si el correo ya existe
    const existingUser = mockUsers.find((user) => user.email === email)
    if (existingUser) {
      return NextResponse.json({ error: "El correo electrónico ya está registrado" }, { status: 400 })
    }

    // En una implementación real, aquí crearíamos el usuario en la base de datos
    // y haríamos hash de la contraseña

    // Simulamos la creación de un nuevo usuario
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: "Public", // Por defecto, los nuevos usuarios tienen rol "Public"
      avatar: "/placeholder.svg?height=40&width=40",
    }

    // En una implementación real, aquí añadiríamos el usuario a la base de datos

    return NextResponse.json({
      success: true,
      message: "Usuario registrado correctamente",
    })
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
