import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Creamos una instancia del cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Exportamos el cliente de Supabase como 'db'
export const db = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Funciones helper para operaciones comunes
export async function getUserById(userId: string) {
  const { data, error } = await db.from("users").select("*").eq("id", userId).single()

  if (error) throw error
  return data
}

export async function getDocumentById(documentId: string) {
  const { data, error } = await db
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

  if (error) throw error
  return data
}

export async function getDocumentPermissions(documentId: string, userId: string) {
  const { data, error } = await db
    .from("document_permissions")
    .select("*")
    .eq("document_id", documentId)
    .eq("user_id", userId)

  if (error) throw error
  return data
}

export async function getUserCertificates(userId: string) {
  const { data, error } = await db.from("user_certificates").select("*").eq("user_id", userId).eq("is_active", true)

  if (error) throw error
  return data
}

export async function getDocumentSignatures(documentId: string) {
  const { data, error } = await db
    .from("document_signatures")
    .select(`
      *,
      users (
        full_name,
        department
      )
    `)
    .eq("document_id", documentId)

  if (error) throw error
  return data
}
