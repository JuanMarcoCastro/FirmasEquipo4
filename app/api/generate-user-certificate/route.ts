import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { spawn } from "child_process"
import path from "path"
import { Buffer } from "buffer"
import fs from "fs"

// Interfaz para la información detallada del certificado devuelta por Python
interface CertificateInfo {
  common_name: string
  email_address: string
  country_name: string
  organization_name: string
  organizational_unit_name: string
  serial_number: number | string
  valid_from: string
  valid_to: string
  issuer_common_name: string
  fingerprint_sha256: string
}

// Función para encontrar el comando Python correcto
function getPythonCommand(): string {
  // En Windows, intentar primero 'py' que es el Python Launcher
  if (process.platform === "win32") {
    return "py"
  }
  // En otros sistemas, usar python3
  return "python3"
}

export async function POST(request: NextRequest) {
  console.log("🔄 Iniciando generación de certificado...")

  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log("❌ Usuario no autenticado")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  console.log("✅ Usuario autenticado:", user.id)

  try {
    const body = await request.json()
    console.log("📝 Request body:", body)

    const { certificate_name_prefix, days_valid, organizational_unit_name_input } = body

    if (!certificate_name_prefix) {
      console.log("❌ Falta certificate_name_prefix")
      return NextResponse.json({ error: "Prefijo para nombre de certificado es requerido." }, { status: 400 })
    }

    console.log("🔍 Obteniendo datos del usuario...")
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("full_name, email, department")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.log("❌ Error obteniendo usuario:", userError)
      return NextResponse.json(
        { error: "No se pudieron obtener los datos del usuario.", details: userError.message },
        { status: 404 },
      )
    }

    if (!userData) {
      console.log("❌ Usuario no encontrado en tabla users")
      return NextResponse.json({ error: "Usuario no encontrado en la base de datos." }, { status: 404 })
    }

    console.log("✅ Datos del usuario:", userData)

    const commonName = userData.full_name || user.email || `Usuario ${user.id}`
    const emailAddress = userData.email || `${user.id}@example.com`
    const organizationalUnit = organizational_unit_name_input || userData.department || "General"
    const countryName = "MX"
    const organizationNameDefault = "Casa Monarca"

    console.log("📋 Parámetros del certificado:", {
      commonName,
      emailAddress,
      organizationalUnit,
      countryName,
      organizationNameDefault,
      daysValid: days_valid || 365,
    })

    // Verificar que el script de Python existe
    const pythonScript = path.join(process.cwd(), "scripts", "professional_signature_manager.py")
    console.log("🐍 Ruta del script Python:", pythonScript)

    if (!fs.existsSync(pythonScript)) {
      console.log("❌ Script de Python no encontrado")
      return NextResponse.json(
        {
          error: "Script de Python no encontrado",
          scriptPath: pythonScript,
        },
        { status: 500 },
      )
    }

    console.log("✅ Script de Python encontrado")

    const pythonCommand = getPythonCommand()
    console.log("🐍 Comando Python a usar:", pythonCommand)

    const pythonArgs = [
      pythonScript,
      "--action",
      "generate_certificate",
      "--user_name",
      commonName,
      "--email",
      emailAddress,
      "--country_name",
      countryName,
      "--org_name",
      organizationNameDefault,
      "--org_unit_name",
      organizationalUnit,
      "--days_valid",
      (days_valid || 365).toString(),
    ]

    console.log("🚀 Ejecutando Python con argumentos:", [pythonCommand, ...pythonArgs])

    // Configurar el entorno para el proceso Python
    const env = { ...process.env }

    // En Windows, asegurar que Python esté en el PATH
    if (process.platform === "win32") {
      const pythonPaths = [
        "C:\\Python39\\",
        "C:\\Python310\\",
        "C:\\Python311\\",
        "C:\\Python312\\",
        "C:\\Users\\" + (process.env.USERNAME || "User") + "\\AppData\\Local\\Programs\\Python\\Python39\\",
        "C:\\Users\\" + (process.env.USERNAME || "User") + "\\AppData\\Local\\Programs\\Python\\Python310\\",
        "C:\\Users\\" + (process.env.USERNAME || "User") + "\\AppData\\Local\\Programs\\Python\\Python311\\",
        "C:\\Users\\" + (process.env.USERNAME || "User") + "\\AppData\\Local\\Programs\\Python\\Python312\\",
      ]

      const currentPath = env.PATH || ""
      const additionalPaths = pythonPaths.join(";")
      env.PATH = `${additionalPaths};${currentPath}`
    }

    const pythonProcess = spawn(pythonCommand, pythonArgs, {
      env,
//    shell: true,
    })

    let output = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      const chunk = data.toString()
      output += chunk
      console.log("📤 Python stdout:", chunk)
    })

    pythonProcess.stderr.on("data", (data) => {
      const chunk = data.toString()
      errorOutput += chunk
      console.log("📤 Python stderr:", chunk)
    })

    return new Promise((resolve) => {
      pythonProcess.on("close", async (code) => {
        console.log(`🏁 Python process terminado con código: ${code}`)
        console.log("📄 Output completo:", output)
        console.log("📄 Error output completo:", errorOutput)

        if (code === 0) {
          try {
            if (!output.trim()) {
              console.log("❌ No hay output del script Python")
              resolve(
                NextResponse.json(
                  {
                    error: "El script de Python no devolvió ningún resultado",
                    pythonStderr: errorOutput,
                    pythonStdout: output,
                  },
                  { status: 500 },
                ),
              )
              return
            }

            console.log("🔍 Parseando JSON del output de Python...")
            const result = JSON.parse(output)
            console.log("✅ JSON parseado:", result)

            if (result.error) {
              console.log("❌ Error reportado por Python:", result.error)
              resolve(NextResponse.json({ error: `Error de generación Python: ${result.error}` }, { status: 500 }))
              return
            }

            if (!result.private_key_pem_base64 || !result.certificate_pem_base64) {
              console.log("❌ Faltan datos del certificado en la respuesta de Python")
              resolve(
                NextResponse.json(
                  {
                    error: "Respuesta incompleta del script de Python",
                    result,
                  },
                  { status: 500 },
                ),
              )
              return
            }

            console.log("🔐 Decodificando certificado y clave privada...")
            const privateKeyPem = Buffer.from(result.private_key_pem_base64, "base64")
            const certificatePem = Buffer.from(result.certificate_pem_base64, "base64")
            const certInfo: CertificateInfo = result.certificate_info

            console.log("📋 Información del certificado:", certInfo)

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
            const finalCertificateName = `${certificate_name_prefix} ${timestamp}`.trim()
            const certFileName = `certificate_${timestamp}.pem`
            const keyFileName = `private_key_${timestamp}.pem`

            const certStoragePath = `${user.id}/certificates/${certFileName}`
            const keyStoragePath = `${user.id}/private_keys/${keyFileName}`

            console.log("☁️ Subiendo archivos a Supabase Storage...")
            console.log("📁 Ruta certificado:", certStoragePath)
            console.log("📁 Ruta clave privada:", keyStoragePath)

            const { error: certUploadError } = await supabase.storage
              .from("user-certificates-bucket")
              .upload(certStoragePath, certificatePem, { contentType: "application/x-pem-file", upsert: true })

            if (certUploadError) {
              console.log("❌ Error subiendo certificado:", certUploadError)
              resolve(
                NextResponse.json(
                  {
                    error: "Error al subir certificado a storage",
                    details: certUploadError.message,
                  },
                  { status: 500 },
                ),
              )
              return
            }

            const { error: keyUploadError } = await supabase.storage
              .from("user-certificates-bucket")
              .upload(keyStoragePath, privateKeyPem, { contentType: "application/x-pem-file", upsert: true })

            if (keyUploadError) {
              console.log("❌ Error subiendo clave privada:", keyUploadError)
              await supabase.storage.from("user-certificates-bucket").remove([certStoragePath]).catch(console.error)
              resolve(
                NextResponse.json(
                  {
                    error: "Error al subir clave privada a storage",
                    details: keyUploadError.message,
                  },
                  { status: 500 },
                ),
              )
              return
            }

            console.log("✅ Archivos subidos exitosamente")

            // Preparar datos para la base de datos - incluir TODOS los campos posibles
            const timestamp_for_reference = Date.now().toString()
            const dbData: any = {
              user_id: user.id,
              certificate_name: finalCertificateName,
              certificate_storage_path: certStoragePath,
              private_key_storage_path: keyStoragePath,
              is_active: true,
              certificate_reference: `cert_${user.id}_${timestamp_for_reference}`,
              private_key_reference: `key_${user.id}_${timestamp_for_reference}`, // Añadir esta línea
            }

            // Solo añadir campos de certificado si están disponibles
            if (certInfo) {
              Object.assign(dbData, {
                cert_common_name: certInfo.common_name,
                cert_email: certInfo.email_address,
                cert_organization: certInfo.organization_name,
                cert_organizational_unit: certInfo.organizational_unit_name,
                cert_country: certInfo.country_name,
                cert_serial_number: certInfo.serial_number?.toString(),
                cert_valid_from: certInfo.valid_from,
                cert_valid_to: certInfo.valid_to,
                cert_issuer_common_name: certInfo.issuer_common_name,
                cert_fingerprint_sha256: certInfo.fingerprint_sha256,
              })
            }

            console.log("💾 Guardando en base de datos...")
            console.log("📋 Datos a guardar:", dbData)

            const { data: dbRecord, error: dbError } = await supabase
              .from("user_certificates")
              .insert(dbData)
              .select("id, certificate_name")
              .single()

            if (dbError) {
              console.log("❌ Error guardando en BD:", dbError)
              // Limpiar archivos si falla la BD
              await supabase.storage
                .from("user-certificates-bucket")
                .remove([certStoragePath, keyStoragePath])
                .catch(console.error)
              resolve(
                NextResponse.json(
                  {
                    error: "Error al guardar registro en base de datos",
                    details: dbError.message,
                    dbData: dbData, // Para debugging
                  },
                  { status: 500 },
                ),
              )
              return
            }

            console.log("✅ Certificado guardado exitosamente:", dbRecord)

            resolve(
              NextResponse.json({
                message: "Certificado generado y guardado exitosamente",
                certificate: dbRecord,
              }),
            )
          } catch (e: any) {
            console.log("❌ Error procesando respuesta de Python:", e)
            resolve(
              NextResponse.json(
                {
                  error: "Fallo al procesar salida de Python",
                  details: e.message,
                  pythonOutput: output,
                  pythonError: errorOutput,
                },
                { status: 500 },
              ),
            )
          }
        } else {
          console.log("❌ Python process falló con código:", code)

          let suggestion = ""
          if (code === 9009) {
            suggestion =
              " Esto indica que Python no se encuentra en el PATH del sistema. Intenta: 1) Reinstalar Python marcando 'Add to PATH', 2) Usar 'py' en lugar de 'python3', o 3) Verificar la instalación de Python."
          }

          resolve(
            NextResponse.json(
              {
                error: "Ejecución de script Python falló" + suggestion,
                exitCode: code,
                pythonStderr: errorOutput,
                pythonStdout: output,
                pythonCommand: pythonCommand,
                platform: process.platform,
              },
              { status: 500 },
            )
          )
        }
      })

      pythonProcess.on("error", (error) => {
        console.log("❌ Error ejecutando Python:", error)
        resolve(
          NextResponse.json(
            {
              error: "Error ejecutando script Python",
              details: error.message,
              suggestion: "Verifica que Python esté instalado y en el PATH del sistema",
            },
            { status: 500 },
          ),
        )
      })
    })
  } catch (error: any) {
    console.log("❌ Error general en API:", error)
    return NextResponse.json(
      {
        error: error.message || "Error interno del servidor",
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
