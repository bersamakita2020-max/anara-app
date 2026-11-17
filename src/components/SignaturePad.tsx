import { useEffect, useRef } from 'react'

export function SignaturePad({ onChange }: { onChange: (data: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    context.strokeStyle = '#0A0A0B'
    context.lineWidth = 2
    context.lineCap = 'round'
  }, [])

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = ref.current!
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function emit() {
    const canvas = ref.current
    if (canvas) onChange(canvas.toDataURL('image/png'))
  }

  return (
    <canvas
      ref={ref}
      width={520}
      height={160}
      className="sign-pad"
      aria-label="Bidang tanda tangan"
      onPointerDown={(event) => {
        drawing.current = true
        const ctx = ref.current?.getContext('2d')
        const p = point(event)
        ctx?.beginPath()
        ctx?.moveTo(p.x, p.y)
      }}
      onPointerMove={(event) => {
        if (!drawing.current) return
        const ctx = ref.current?.getContext('2d')
        const p = point(event)
        ctx?.lineTo(p.x, p.y)
        ctx?.stroke()
      }}
      onPointerUp={() => {
        drawing.current = false
        emit()
      }}
      onPointerLeave={() => {
        if (drawing.current) {
          drawing.current = false
          emit()
        }
      }}
    />
  )
}
