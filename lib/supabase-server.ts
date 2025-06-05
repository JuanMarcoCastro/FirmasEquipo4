import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export const createServerClient = () => {
  try {
    return createServerComponentClient<Database>({
      cookies,
    })
  } catch (error) {
    console.error("Error creating Supabase server client:", error)
    // Return a minimal client that will fail gracefully
    throw new Error("Failed to create Supabase client")
  }
}
