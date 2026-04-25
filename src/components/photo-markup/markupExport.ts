import type { BrushStroke } from './markupTypes'

export interface ImageLayoutRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Rasterize the base image plus brush strokes at full resolution.
 * Strokes are stored in stage coordinates; they are mapped into image pixel space.
 */
export function mergeImageWithBrushStrokes(
  image: HTMLImageElement,
  strokes: BrushStroke[],
  imageRect: ImageLayoutRect,
  options?: { mimeType?: string; quality?: number },
): string {
  const w = image.naturalWidth
  const h = image.naturalHeight
  if (w <= 0 || h <= 0) {
    return ''
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return ''
  }

  ctx.drawImage(image, 0, 0, w, h)

  const scaleX = w / imageRect.width
  const scaleY = h / imageRect.height
  const scaleAvg = (scaleX + scaleY) / 2

  for (const stroke of strokes) {
    const pts = stroke.points
    if (pts.length < 4) continue

    ctx.save()
    ctx.strokeStyle = stroke.stroke
    ctx.lineWidth = Math.max(1, stroke.strokeWidth * scaleAvg)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()

    const x0 = (pts[0] - imageRect.x) * scaleX
    const y0 = (pts[1] - imageRect.y) * scaleY
    ctx.moveTo(x0, y0)
    for (let i = 2; i < pts.length; i += 2) {
      ctx.lineTo((pts[i] - imageRect.x) * scaleX, (pts[i + 1] - imageRect.y) * scaleY)
    }
    ctx.stroke()
    ctx.restore()
  }

  const mime = options?.mimeType ?? 'image/jpeg'
  const quality = mime === 'image/png' ? undefined : (options?.quality ?? 0.9)
  return canvas.toDataURL(mime, quality)
}
