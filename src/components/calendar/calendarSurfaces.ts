/**
 * Shared Tailwind class fragments for the Schedule / calendar UI.
 * Polished light/dark: crisp edges, readable type, tight rhythm, subtle depth.
 */
export const cal = {
  pageWash:
    'pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-500/10 dark:via-[#0B0F14]/40 dark:to-transparent',

  /** Primary elevated panel */
  panel:
    'rounded-[18px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/[0.03] dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_12px_40px_-20px_rgba(0,0,0,0.65)] dark:ring-white/[0.04]',

  /** Filter strip */
  panelSoft:
    'rounded-[18px] border border-slate-200 bg-white px-3.5 py-3 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] dark:ring-white/[0.04]',

  /** Main calendar column */
  mainColumn:
    'min-w-0 flex-1 space-y-4 rounded-[22px] border border-slate-200 bg-white/95 p-3.5 shadow-lg shadow-slate-900/[0.05] ring-1 ring-slate-900/[0.03] backdrop-blur-[2px] dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_16px_48px_-22px_rgba(0,0,0,0.65)] dark:ring-white/[0.04] sm:p-4 lg:p-5',

  sidebarCtaWrap:
    'rounded-[18px] border border-slate-200 bg-white p-0.5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] dark:ring-white/[0.04]',

  textPrimary: 'text-slate-900 dark:text-[#F8FAFC]',
  textBody: 'text-slate-600 dark:text-[#94A3B8]',
  /** Section labels, uppercase */
  textMuted: 'text-slate-600 dark:text-slate-400',
  textFaint: 'text-slate-500 dark:text-slate-500',

  /** Shared uppercase label style */
  sectionLabel: 'text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-[#94A3B8]',

  secondaryLink:
    'inline-flex items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-px hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 dark:border-[#1F2A36] dark:bg-[#151B23] dark:text-slate-100 dark:shadow-black/30 dark:hover:border-slate-600 dark:hover:bg-[#1A2230]',

  navIconButton:
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-px hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 dark:border-[#1F2A36] dark:bg-[#151B23] dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-[#1A2230] dark:hover:text-white',

  navMonthArrow:
    'inline-flex min-h-[2.5rem] min-w-[2.5rem] shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white',

  searchInput:
    'min-h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50/90 py-2 pl-10 pr-3 text-base text-slate-900 shadow-inner shadow-slate-900/[0.02] placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-[#1F2A36] dark:bg-[#11161D] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400/80 dark:focus:bg-[#151B23] sm:text-sm',

  segmentedTrack:
    'inline-flex w-full shrink-0 justify-center rounded-xl border border-slate-200/80 bg-slate-100/90 p-0.5 shadow-inner min-[480px]:w-auto dark:border-slate-700 dark:bg-slate-950/95',

  segmentedActive:
    'bg-white text-slate-900 shadow-sm shadow-slate-900/10 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-white dark:shadow-black/35 dark:ring-slate-600 dark:ring-emerald-500/30',

  segmentedInactive:
    'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',

  select:
    'min-h-11 w-full rounded-[14px] border border-slate-200 bg-white px-2.5 text-base font-medium text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-[#1F2A36] dark:bg-[#151B23] dark:text-slate-100 dark:focus:border-blue-400/80 sm:text-sm',

  gridFrame:
    'scroll-momentum overflow-x-auto rounded-[22px] border border-slate-200 bg-white shadow-lg shadow-slate-900/[0.05] ring-1 ring-slate-900/[0.03] dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-12px_rgba(0,0,0,0.55)] dark:ring-white/[0.04]',

  weekdayHeader:
    'grid grid-cols-7 border-b border-slate-200/85 bg-gradient-to-b from-slate-50 to-slate-50/90 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:border-slate-700 dark:from-slate-950 dark:to-slate-900 dark:text-slate-400',

  dayCellChrome:
    'relative min-h-[138px] border-b border-r border-slate-100 p-1.5 transition-colors last:border-r-0 dark:border-slate-800/80',

  /** Full-cell click target: hover wash + group for add hint */
  dayCellInteractive:
    'group/day cursor-pointer select-none rounded-[4px] transition-[background-color,box-shadow] duration-200 ease-out hover:bg-emerald-50/65 hover:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.16)] dark:hover:bg-emerald-950/32 dark:hover:shadow-[inset_0_0_0_1px_rgba(52,211,153,0.22)] active:bg-emerald-50/85 dark:active:bg-emerald-950/45',

  /** Day tied to open “create job” modal — subtle emphasis vs today ring */
  daySchedulingFocus:
    'ring-2 ring-inset ring-emerald-500/50 bg-emerald-50/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45)] dark:ring-emerald-400/45 dark:bg-emerald-950/38 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]',

  /** Subtle “+” on day hover (pointer-events-none) */
  dayAddHint:
    'pointer-events-none absolute right-1 top-1 z-0 flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600/[0.16] text-[13px] font-semibold leading-none text-emerald-800 opacity-0 shadow-sm ring-1 ring-emerald-600/10 transition-opacity duration-200 ease-out group-hover/day:opacity-100 dark:bg-emerald-500/24 dark:text-emerald-200 dark:ring-emerald-400/15',

  dayCellChromeSm:
    'min-h-[124px] border-b border-r border-slate-100 p-1.5 last:border-r-0 dark:border-slate-800/80',

  dayInWeekday: 'bg-white dark:bg-slate-900',
  dayInWeekend: 'bg-slate-50/55 dark:bg-slate-950/40',
  dayOutMonth: 'bg-slate-50/88 dark:bg-slate-950',

  todayRing: 'ring-2 ring-inset ring-emerald-500/30 dark:ring-emerald-400/40',

  dayNumToday:
    'bg-emerald-600 text-white shadow-md shadow-emerald-900/25 dark:bg-emerald-500 dark:shadow-emerald-950/40',

  dayNumIn:
    'text-slate-800 hover:bg-slate-100/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:text-slate-100 dark:hover:bg-slate-800',

  dayNumOut:
    'text-slate-400 hover:bg-slate-100/85 dark:text-slate-500 dark:hover:bg-slate-900/90',

  dayNumInRead: 'text-slate-800 dark:text-slate-100',
  dayNumOutRead: 'text-slate-400 dark:text-slate-500',

  morePill:
    'cursor-default select-none rounded-md border border-slate-200/90 bg-white px-1.5 py-1 text-center text-[11px] font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:shadow-none',

  emptyStateCard:
    'flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white px-5 py-12 text-center shadow-inner dark:border-slate-700 dark:from-slate-900 dark:to-slate-950 dark:shadow-none',

  roadmapPlaceholder:
    'flex min-h-[min(48vh,440px)] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white px-5 py-12 text-center dark:border-slate-700 dark:from-slate-950/90 dark:to-slate-900',

  iconTile:
    'flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/85 dark:bg-slate-800 dark:text-emerald-400 dark:ring-slate-700',
} as const
