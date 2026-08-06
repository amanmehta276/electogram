import { useEffect, useRef } from "react"

interface WaveformCanvasProps {
  buffer: AudioBuffer | null
  color: string
  height?: number
}

export function WaveformCanvas({ buffer, color, height = 60 }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    if (!buffer) {
      ctx.strokeStyle = color
      ctx.globalAlpha = 0.2
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()
      return
    }

    const data = buffer.getChannelData(0)
    const samplesPerPixel = Math.max(1, Math.floor(data.length / width))
    const mid = height / 2

    ctx.strokeStyle = color
    ctx.globalAlpha = 0.9
    ctx.lineWidth = 1
    ctx.beginPath()

    for (let x = 0; x < width; x++) {
      const start = x * samplesPerPixel
      let min = 1
      let max = -1
      for (let i = 0; i < samplesPerPixel; i++) {
        const sample = data[start + i]
        if (sample === undefined) continue
        if (sample < min) min = sample
        if (sample > max) max = sample
      }
      if (min > max) {
        min = 0
        max = 0
      }
      ctx.moveTo(x, mid + min * mid)
      ctx.lineTo(x, mid + max * mid)
    }
    ctx.stroke()
  }, [buffer, color, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: `${height}px`, display: "block" }}
    />
  )
}
