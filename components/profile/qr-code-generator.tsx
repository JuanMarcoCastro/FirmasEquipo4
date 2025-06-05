"use client"

import { useEffect, useRef } from "react"

interface QRCodeGeneratorProps {
  value: string
  size?: number
}

export default function QRCodeGenerator({ value, size = 200 }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return

    // Simple QR code generation using a library or API
    // For production, use a proper QR code library like 'qrcode'
    generateQRCode(value, canvasRef.current, size)
  }, [value, size])

  const generateQRCode = async (text: string, canvas: HTMLCanvasElement, size: number) => {
    try {
      // Using QR Server API as fallback
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          canvas.width = size
          canvas.height = size
          ctx.drawImage(img, 0, 0, size, size)
        }
      }
      img.src = qrUrl
    } catch (error) {
      console.error("Error generating QR code:", error)

      // Fallback: draw a simple placeholder
      const ctx = canvas.getContext("2d")
      if (ctx) {
        canvas.width = size
        canvas.height = size
        ctx.fillStyle = "#f0f0f0"
        ctx.fillRect(0, 0, size, size)
        ctx.fillStyle = "#666"
        ctx.font = "14px Arial"
        ctx.textAlign = "center"
        ctx.fillText("QR Code", size / 2, size / 2)
      }
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <canvas ref={canvasRef} className="max-w-full h-auto" />
    </div>
  )
}
