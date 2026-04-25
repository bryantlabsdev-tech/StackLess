/** Stable accent per employee id for schedule cards and filters. */

export type EmployeeColorStyle = {
  strip: string
  soft: string
  border: string
  text: string
  ring: string
  dot: string
}

export const UNASSIGNED_COLOR: EmployeeColorStyle = {
  strip: 'bg-amber-400',
  soft: 'bg-amber-50',
  border: 'border-amber-200/90',
  text: 'text-amber-950',
  ring: 'ring-amber-400/25',
  dot: 'bg-amber-400',
}

const PALETTE: EmployeeColorStyle[] = [
  {
    strip: 'bg-emerald-500',
    soft: 'bg-emerald-50',
    border: 'border-emerald-200/90',
    text: 'text-emerald-950',
    ring: 'ring-emerald-500/25',
    dot: 'bg-emerald-500',
  },
  {
    strip: 'bg-sky-500',
    soft: 'bg-sky-50',
    border: 'border-sky-200/90',
    text: 'text-sky-950',
    ring: 'ring-sky-500/25',
    dot: 'bg-sky-500',
  },
  {
    strip: 'bg-violet-500',
    soft: 'bg-violet-50',
    border: 'border-violet-200/90',
    text: 'text-violet-950',
    ring: 'ring-violet-500/25',
    dot: 'bg-violet-500',
  },
  {
    strip: 'bg-rose-500',
    soft: 'bg-rose-50',
    border: 'border-rose-200/90',
    text: 'text-rose-950',
    ring: 'ring-rose-500/25',
    dot: 'bg-rose-500',
  },
  {
    strip: 'bg-teal-500',
    soft: 'bg-teal-50',
    border: 'border-teal-200/90',
    text: 'text-teal-950',
    ring: 'ring-teal-500/25',
    dot: 'bg-teal-500',
  },
  {
    strip: 'bg-indigo-500',
    soft: 'bg-indigo-50',
    border: 'border-indigo-200/90',
    text: 'text-indigo-950',
    ring: 'ring-indigo-500/25',
    dot: 'bg-indigo-500',
  },
  {
    strip: 'bg-orange-500',
    soft: 'bg-orange-50',
    border: 'border-orange-200/90',
    text: 'text-orange-950',
    ring: 'ring-orange-500/25',
    dot: 'bg-orange-500',
  },
  {
    strip: 'bg-cyan-500',
    soft: 'bg-cyan-50',
    border: 'border-cyan-200/90',
    text: 'text-cyan-950',
    ring: 'ring-cyan-500/25',
    dot: 'bg-cyan-500',
  },
]

function hashToIndex(id: string, mod: number): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  }
  return Math.abs(h) % mod
}

export function colorForEmployeeId(employeeId: string | null | undefined): EmployeeColorStyle {
  if (!employeeId) return UNASSIGNED_COLOR
  return PALETTE[hashToIndex(employeeId, PALETTE.length)]
}
