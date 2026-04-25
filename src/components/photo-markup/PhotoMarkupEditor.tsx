import Konva from 'konva'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Image as KonvaImage, Layer, Line, Stage } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { Button } from '../ui/Button'
import { mergeImageWithBrushStrokes } from './markupExport'
import type { BrushStroke } from './markupTypes'

/** Default brush width in stage (CSS) pixels — scales to full image on export. */
const BRUSH_WIDTH = 4

const COLORS = [
  { id: 'rose', value: '#e11d48' },
  { id: 'orange', value: '#ea580c' },
  { id: 'amber', value: '#d97706' },
  { id: 'emerald', value: '#059669' },
  { id: 'blue', value: '#2563eb' },
  { id: 'white', value: '#f8fafc' },
] as const

function fitContain(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
): { x: number; y: number; width: number; height: number } {
  const scale = Math.min(boxW / imgW, boxH / imgH, Number.POSITIVE_INFINITY)
  const width = imgW * scale
  const height = imgH * scale
  const x = (boxW - width) / 2
  const y = (boxH - height) / 2
  return { x, y, width, height }
}

function inRect(
  pos: { x: number; y: number },
  r: { x: number; y: number; width: number; height: number },
): boolean {
  return pos.x >= r.x && pos.x <= r.x + r.width && pos.y >= r.y && pos.y <= r.y + r.height
}

export function PhotoMarkupEditor({
  imageSrc,
  onClose,
  onSave,
}: {
  imageSrc: string | null
  onClose: () => void
  /** Merged JPEG data URL */
  onSave: (dataUrl: string) => void
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!imageSrc) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) {
        setImage(img)
        setFailed(false)
      }
    }
    img.onerror = () => {
      if (!cancelled) {
        setImage(null)
        setFailed(true)
      }
    }
    img.src = imageSrc
    return () => {
      cancelled = true
    }
  }, [imageSrc])
  const containerRef = useRef<HTMLDivElement>(null)
  const workingLineRef = useRef<Konva.Line>(null)
  const stageRef = useRef<Konva.Stage>(null)

  const [stageSize, setStageSize] = useState({ width: 320, height: 480 })
  const [strokes, setStrokes] = useState<BrushStroke[]>([])
  const [color, setColor] = useState<string>(COLORS[4].value)
  const [busy, setBusy] = useState(false)

  const drawingRef = useRef(false)
  const pointsRef = useRef<number[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (!cr) return
      const w = Math.max(120, Math.floor(cr.width))
      const h = Math.max(120, Math.floor(cr.height))
      setStageSize({ width: w, height: h })
    })
    ro.observe(el)
    const r = el.getBoundingClientRect()
    setStageSize({
      width: Math.max(120, Math.floor(r.width)),
      height: Math.max(120, Math.floor(r.height)),
    })
    return () => ro.disconnect()
  }, [])

  const imageRect = useMemo(() => {
    if (!image || stageSize.width < 1 || stageSize.height < 1) return null
    return fitContain(image.naturalWidth, image.naturalHeight, stageSize.width, stageSize.height)
  }, [image, stageSize])

  const flushStroke = useCallback(() => {
    const pts = pointsRef.current
    drawingRef.current = false
    setIsDrawing(false)
    pointsRef.current = []
    workingLineRef.current?.points([])
    workingLineRef.current?.getLayer()?.batchDraw()

    if (pts.length >= 4) {
      setStrokes((prev) => [
        ...prev,
        { tool: 'brush', points: [...pts], stroke: color, strokeWidth: BRUSH_WIDTH },
      ])
    }
  }, [color])

  useEffect(() => {
    const onWinUp = () => {
      if (drawingRef.current) flushStroke()
    }
    window.addEventListener('mouseup', onWinUp)
    window.addEventListener('touchend', onWinUp)
    return () => {
      window.removeEventListener('mouseup', onWinUp)
      window.removeEventListener('touchend', onWinUp)
    }
  }, [flushStroke])

  const handlePointerDown = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!imageRect || !image) return
      e.evt.preventDefault()
      const stage = e.target.getStage()
      const pos = stage?.getPointerPosition()
      if (!pos || !inRect(pos, imageRect)) return

      drawingRef.current = true
      setIsDrawing(true)
      pointsRef.current = [pos.x, pos.y]
      workingLineRef.current?.stroke(color)
      workingLineRef.current?.strokeWidth(BRUSH_WIDTH)
      workingLineRef.current?.points(pointsRef.current)
      workingLineRef.current?.getLayer()?.batchDraw()
    },
    [image, imageRect, color],
  )

  const handlePointerMove = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!drawingRef.current || !imageRect) return
      e.evt.preventDefault()
      const stage = stageRef.current
      const pos = stage?.getPointerPosition()
      if (!pos) return

      const clamped = {
        x: Math.min(imageRect.x + imageRect.width, Math.max(imageRect.x, pos.x)),
        y: Math.min(imageRect.y + imageRect.height, Math.max(imageRect.y, pos.y)),
      }

      pointsRef.current.push(clamped.x, clamped.y)
      workingLineRef.current?.points(pointsRef.current)
      workingLineRef.current?.getLayer()?.batchDraw()
    },
    [imageRect],
  )

  const handlePointerUp = useCallback(() => {
    if (drawingRef.current) flushStroke()
  }, [flushStroke])

  const handleClear = useCallback(() => {
    if (drawingRef.current) {
      drawingRef.current = false
      setIsDrawing(false)
      pointsRef.current = []
      workingLineRef.current?.points([])
    }
    setStrokes([])
  }, [])

  const handleUndo = useCallback(() => {
    if (drawingRef.current) flushStroke()
    setStrokes((s) => s.slice(0, -1))
  }, [flushStroke])

  const handleSave = useCallback(() => {
    if (!image || !imageRect || failed) return

    let finalStrokes = strokes
    if (drawingRef.current) {
      const pts = pointsRef.current
      drawingRef.current = false
      setIsDrawing(false)
      pointsRef.current = []
      workingLineRef.current?.points([])
      if (pts.length >= 4) {
        finalStrokes = [
          ...strokes,
          { tool: 'brush', points: [...pts], stroke: color, strokeWidth: BRUSH_WIDTH },
        ]
      }
      setStrokes(finalStrokes)
    }

    setBusy(true)
    requestAnimationFrame(() => {
      try {
        const merged = mergeImageWithBrushStrokes(image, finalStrokes, imageRect, {
          mimeType: 'image/jpeg',
          quality: 0.9,
        })
        if (merged) onSave(merged)
      } finally {
        setBusy(false)
      }
    })
  }, [image, imageRect, strokes, failed, onSave, color])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label="Photo markup"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/90 bg-slate-900/95 px-3 py-3 backdrop-blur-sm sm:px-4">
        <Button
          type="button"
          variant="ghost"
          className="min-h-[44px] shrink-0 text-slate-200 hover:bg-slate-800"
          onClick={onClose}
        >
          Close
        </Button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold text-white">Mark up photo</p>
          <p className="truncate text-xs text-slate-400">Draw instructions on the image, then save</p>
        </div>
        <Button
          type="button"
          className="min-h-[44px] min-w-[5rem] shrink-0 font-semibold"
          onClick={handleSave}
          disabled={busy || !image || failed}
        >
          {busy ? '…' : 'Save'}
        </Button>
      </header>

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 touch-none bg-slate-950"
        style={{ touchAction: 'none' }}
      >
        {failed ? (
          <p className="flex h-full items-center justify-center px-4 text-center text-sm text-red-300">
            Could not load this image. Try another photo.
          </p>
        ) : !image || !imageRect ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-500">Loading…</p>
        ) : (
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handlePointerDown}
            onMousemove={handlePointerMove}
            onMouseup={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            <Layer listening={false}>
              <KonvaImage image={image} x={imageRect.x} y={imageRect.y} width={imageRect.width} height={imageRect.height} listening={false} />
            </Layer>
            <Layer>
              {strokes.map((s, i) => (
                <Line
                  key={i}
                  points={s.points}
                  stroke={s.stroke}
                  strokeWidth={s.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.35}
                  perfectDrawEnabled={false}
                  listening={false}
                />
              ))}
              <Line
                ref={workingLineRef}
                points={[]}
                stroke={color}
                strokeWidth={BRUSH_WIDTH}
                lineCap="round"
                lineJoin="round"
                tension={0.35}
                perfectDrawEnabled={false}
                listening={false}
              />
            </Layer>
          </Stage>
        )}
      </div>

      <footer className="shrink-0 border-t border-slate-800/90 bg-slate-900/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-4">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          <div className="flex items-center justify-center gap-2">
            <span className="sr-only" id="markup-colors-label">
              Ink color
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-labelledby="markup-colors-label">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.id}
                  onClick={() => setColor(c.value)}
                  className={`h-10 w-10 rounded-full border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    color === c.value
                      ? 'border-white ring-2 ring-emerald-400/80'
                      : 'border-slate-600 hover:border-slate-400'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-xl border border-emerald-500/60 bg-emerald-950/50 px-3 text-sm font-semibold text-emerald-200"
                title="Brush"
              >
                ✎
              </span>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                className="min-h-[44px] dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                onClick={handleUndo}
                disabled={strokes.length === 0}
              >
                Undo
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-[44px] dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                onClick={handleClear}
                disabled={strokes.length === 0 && !isDrawing}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
