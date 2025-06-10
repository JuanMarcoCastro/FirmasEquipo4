import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createHash, randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { documentId, certificateId, signatureReason } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: "ID de documento requerido" }, { status: 400 })
    }

    // Get document info with uploader details
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select(`
        *,
        users!documents_uploaded_by_fkey (
          full_name,
          department
        )
      `)
      .eq("id", documentId)
      .single()

    if (docError || !document) {
      console.error("Document error:", docError)
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    // Get current user data
    const { data: currentUser, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (userError || !currentUser) {
      console.error("User error:", userError)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Check if user has explicit permission to sign this document
    const { data: signPermission } = await supabase
      .from("document_permissions")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", user.id)
      .eq("permission_type", "sign")
      .single()

    // Check if user can sign this document (expanded logic)
    const canSign =
      signPermission ||
      document.uploaded_by === user.id ||
      currentUser.role === "system_admin" ||
      (currentUser.role === "area_coordinator" && currentUser.department === document.users?.department)

    if (!canSign) {
      return NextResponse.json({ error: "No tienes permisos para firmar este documento" }, { status: 403 })
    }

    // Check if user has already signed this document
    const { data: existingSignature } = await supabase
      .from("document_signatures")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", user.id)
      .single()

    if (existingSignature) {
      return NextResponse.json({ error: "Ya has firmado este documento" }, { status: 400 })
    }

    // Generate a simulated digital signature hash
    const timestamp = new Date().toISOString()
    const signatureContent = `${documentId}-${user.id}-${timestamp}-${signatureReason || "Firma digital"}`
    const signatureHash = createHash("sha256").update(signatureContent).digest("hex")
    const signatureId = randomBytes(16).toString("hex")

    // Create signature data for demo purposes
    const signatureData = {
      signer_name: currentUser.full_name || user.email,
      signer_email: user.email,
      signature_time: timestamp,
      signature_reason: signatureReason || "Firma digital",
      certificate_id: certificateId || null,
      user_role: currentUser.role,
      user_department: currentUser.department,
      signature_algorithm: "SHA256withRSA (Simulated)",
      signature_id: signatureId,
    }

    // Record the signature in the database
    const { data: signature, error: sigError } = await supabase
      .from("document_signatures")
      .insert({
        document_id: documentId,
        user_id: user.id,
        certificate_id: certificateId || null,
        signature_reason: signatureReason || "Firma digital",
        signature_data: signatureData,
        signature_hash: signatureHash,
        signed_at: timestamp,
      })
      .select()
      .single()

    if (sigError) {
      console.error("Signature error details:", sigError)
      return NextResponse.json(
        {
          error: `Error registrando firma: ${sigError.message || sigError.details || "Error desconocido"}`,
        },
        { status: 500 },
      )
    }

    // Update document status if all required signatures are complete
    const { data: allPermissions } = await supabase
      .from("document_permissions")
      .select("*")
      .eq("document_id", documentId)
      .eq("permission_type", "sign")

    const { data: allSignatures } = await supabase.from("document_signatures").select("*").eq("document_id", documentId)

    const requiredSignatures = allPermissions?.length || 1
    const completedSignatures = (allSignatures?.length || 0) + 1

    // Update document status
    let newStatus = "pending_signatures"
    if (completedSignatures >= requiredSignatures) {
      newStatus = "signed"
      await supabase.from("documents").update({ status: "signed" }).eq("id", documentId)
    }

    return NextResponse.json({
      message: "Documento firmado exitosamente",
      signatureId: signature.id,
      signatureHash: signatureHash,
      documentStatus: newStatus,
      signaturesCompleted: completedSignatures,
      signaturesRequired: requiredSignatures,
      signerInfo: {
        name: currentUser.full_name,
        role: currentUser.role,
        department: currentUser.department,
      },
      timestamp: timestamp,
    })
  } catch (error: any) {
    console.error("Error signing document:", error)
    return NextResponse.json(
      {
        error: `Error interno del servidor: ${error.message || "Error desconocido"}`,
      },
      { status: 500 },
    )
  }
}
