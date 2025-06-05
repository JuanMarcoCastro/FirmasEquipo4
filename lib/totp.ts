// TOTP implementation based on RFC 6238 using Web Crypto API

export class TOTP {
  private secret: string
  private period: number
  private digits: number

  constructor(secret: string, period = 30, digits = 6) {
    this.secret = secret
    this.period = period
    this.digits = digits
  }

  // Generate TOTP code for current time
  now(): string {
    const timeStep = Math.floor(Date.now() / 1000 / this.period)
    return this.generate(timeStep)
  }

  // Generate TOTP code for specific time step
  async generate(timeStep: number): Promise<string> {
    const secretBytes = this.base32ToBytes(this.secret)
    const timeBytes = this.intToBytes(timeStep)

    // Use Web Crypto API for HMAC-SHA1
    const key = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(secretBytes),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"],
    )

    const signature = await crypto.subtle.sign("HMAC", key, new Uint8Array(timeBytes))
    const hash = new Uint8Array(signature)

    const offset = hash[hash.length - 1] & 0x0f
    const code =
      (((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff)) %
      Math.pow(10, this.digits)

    return code.toString().padStart(this.digits, "0")
  }

  // Verify TOTP code with time window
  async verify(token: string, window = 1): Promise<boolean> {
    const timeStep = Math.floor(Date.now() / 1000 / this.period)

    for (let i = -window; i <= window; i++) {
      const testTimeStep = timeStep + i
      const expectedToken = await this.generate(testTimeStep)
      if (expectedToken === token) {
        return true
      }
    }

    return false
  }

  // Convert base32 string to bytes
  private base32ToBytes(base32: string): number[] {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    let bits = ""

    // Remove any whitespace and convert to uppercase
    const cleanBase32 = base32.replace(/\s/g, "").toUpperCase()

    for (const char of cleanBase32) {
      const index = alphabet.indexOf(char)
      if (index === -1) {
        if (char === "=") break // Padding character
        continue // Skip invalid characters
      }
      bits += index.toString(2).padStart(5, "0")
    }

    const bytes: number[] = []
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8)
      if (byte.length === 8) {
        bytes.push(Number.parseInt(byte, 2))
      }
    }

    return bytes
  }

  // Convert integer to 8-byte array (big endian)
  private intToBytes(num: number): number[] {
    const bytes = new Array(8).fill(0)
    for (let i = 7; i >= 0; i--) {
      bytes[i] = num & 0xff
      num = Math.floor(num / 256)
    }
    return bytes
  }

  // Generate provisioning URI for QR code
  provisioningUri(name: string, issuer: string): string {
    const params = new URLSearchParams({
      secret: this.secret,
      issuer: issuer,
      algorithm: "SHA1",
      digits: this.digits.toString(),
      period: this.period.toString(),
    })

    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(name)}?${params.toString()}`
  }
}

// Generate random base32 secret
export function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let secret = ""
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}
