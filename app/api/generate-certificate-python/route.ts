import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Check if user already has an active certificate
    const { data: existingCert } = await supabase
      .from("user_certificates")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (existingCert) {
      return NextResponse.json({
        message: "El usuario ya tiene un certificado activo",
        certificateId: existingCert.id,
      })
    }

    // Call Python script to generate certificate
    const pythonScript = path.join(process.cwd(), "scripts", "digital_signature_backend.py")

    const pythonProcess = spawn("python3", [
      pythonScript,
      "--action",
      "generate_certificate",
      "--user_id",
      user.id,
      "--user_name",
      userData.full_name || user.email,
      "--email",
      user.email,
      "--supabase_url",
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      "--supabase_key",
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    ])

    let output = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString()
    })

    return new Promise((resolve) => {
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output)
            resolve(
              NextResponse.json({
                message: "Certificado generado exitosamente",
                certificateId: result.certificate_id,
                certificateName: result.certificate_name,
                serialNumber: result.serial_number,
                expiresAt: result.expires_at,
              }),
            )
          } catch (e) {
            resolve(
              NextResponse.json(
                {
                  error: "Error procesando respuesta del generador de certificados",
                },
                { status: 500 },
              ),
            )
          }
        } else {
          console.error("Python script error:", errorOutput)
          resolve(
            NextResponse.json(
              {
                error: `Error generando certificado: ${errorOutput || "Error desconocido"}`,
              },
              { status: 500 },
            ),
          )
        }
      })
    })
  } catch (error: any) {
    console.error("Error generating certificate:", error)
    return NextResponse.json(
      {
        error: `Error interno del servidor: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
