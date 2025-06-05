"use client"

import { useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Eraser, Check } from "lucide-react"

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void
  onCancel: () => void
}

export default function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const clear = () => {
    sigCanvas.current?.clear()
    setIsEmpty(true)
  }

  const save = () => {
    if (sigCanvas.current && !isEmpty) {
      const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png")
      onSave(dataURL)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Dibuja tu firma</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md bg-white">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              className: "w-full h-40",
            }}
            onBegin={() => setIsEmpty(false)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={clear}>
            <Eraser className="mr-2 h-4 w-4" />
            Borrar
          </Button>
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button size="sm" onClick={save} disabled={isEmpty}>
            <Check className="mr-2 h-4 w-4" />
            Confirmar
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
