import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// Deberás configurar esta URL para que apunte a tu servicio de Python con PyHanko
const PYTHON_SIGNING_SERVICE_URL = process.env.PYTHON_SIGNING_SERVICE_URL || "http://localhost:8000/sign_document";

export async function POST(request: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { documentUrl, originalFileName } = await request.json();

  if (!documentUrl || !originalFileName) {
    return NextResponse.json({ error: "Falta documentUrl o originalFileName" }, { status: 400 });
  }

  try {
    console.log(`Solicitando firma para el documento: ${documentUrl} (nombre original: ${originalFileName})`);

    // Llamada al servicio de Python que implementa PyHanko
    const response = await fetch(PYTHON_SIGNING_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_url: documentUrl, // URL del documento a firmar (ej. de Supabase Storage)
        original_file_name: originalFileName, // Nombre original del archivo
        // Aquí puedes pasar información adicional que tu servicio PyHanko pueda necesitar:
        // - Detalles del firmante (obtenidos de 'user' o pasados desde el frontend)
        // - Tipo de firma (ej. PAdES B-T, B-LT, B-LTA)
        // - Información del certificado a utilizar (si no está preconfigurado en el servicio Python)
        signer_info: {
          email: user.email,
          name: user.user_metadata?.full_name || user.email, // Ajusta según tu modelo de datos
          // otros detalles relevantes...
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error desde el servicio de firma PyHanko:", errorData);
      return NextResponse.json({ error: "Error al firmar el documento con el servicio externo", details: errorData }, { status: response.status });
    }

    const signedDocumentData = await response.json(); // El servicio Python debería devolver información del documento firmado

    // Ejemplo de lo que podría devolver tu servicio Python:
    // { signed_document_url: "url_del_documento_firmado_en_storage", new_file_name: "nombre_del_archivo_firmado.pdf" }

    // Aquí, deberías actualizar tu base de datos (Supabase) con la información del documento firmado.
    // Por ejemplo, podrías guardar la nueva URL y marcar el documento como firmado.
    // await supabase
    //   .from("documents")
    //   .update({
    //     signed_storage_url: signedDocumentData.signed_document_url,
    //     status: "signed_pyhanko",
    //     signed_at: new Date().toISOString(),
    //     signed_by_user_id: user.id,
    //     signed_file_name: signedDocumentData.new_file_name
    //   })
    //   .eq("storage_url", documentUrl); // O usa el ID del documento si lo tienes

    return NextResponse.json({
      message: "Documento enviado al servicio de firma. El proceso puede ser asíncrono.",
      signedDocumentInfo: signedDocumentData,
    });

  } catch (error) {
    console.error("Error interno al procesar la solicitud de firma:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error interno del servidor al solicitar la firma", details: errorMessage }, { status: 500 });
  }
}
