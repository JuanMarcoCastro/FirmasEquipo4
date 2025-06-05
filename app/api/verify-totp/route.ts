import { type NextRequest, NextResponse } from "next/server"
import { TOTP } from "@/lib/totp"

export async function POST(request: NextRequest) {
  try {
    const { secret, token } = await request.json()

    console.log("TOTP Verification Request:", {
      secret: secret ? `${secret.substring(0, 8)}...` : "missing",
      token: token || "missing",
      tokenLength: token ? token.length : 0,
    })

    if (!secret || !token) {
      return NextResponse.json({ error: "Secret and token are required" }, { status: 400 })
    }

    // Validate token format
    if (!/^\d{6}$/.test(token)) {
      console.log("Invalid token format:", token)
      return NextResponse.json({ valid: false, error: "Token must be 6 digits" }, { status: 400 })
    }

    // Create TOTP instance and verify
    const totp = new TOTP(secret)

    // Generate current expected token for debugging
    const currentToken = await totp.generate(Math.floor(Date.now() / 1000 / 30))
    console.log("Expected current token:", currentToken)

    const isValid = await totp.verify(token, 2) // Allow 2 time steps of drift (±60 seconds)

    console.log(`TOTP Verification Result: token=${token}, expected=${currentToken}, valid=${isValid}`)

    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error("TOTP verification error:", error)
    return NextResponse.json({ error: "Internal server error", valid: false }, { status: 500 })
  }
}
