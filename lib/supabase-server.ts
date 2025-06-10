import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

// Versión simplificada sin try-catch
export const createServerClient = () => {
  return createServerComponentClient<Database>({
    cookies,
  })
}
