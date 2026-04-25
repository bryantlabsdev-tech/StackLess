import { cal } from './calendarSurfaces'

export type SidebarQuickPreset = 'all' | 'unassigned' | 'today'

export function SidebarQuickFilters({
  active,
  onChange,
}: {
  active: SidebarQuickPreset
  onChange: (preset: SidebarQuickPreset) => void
}) {
  const items: { id: SidebarQuickPreset; label: string; hint: string }[] = [
    { id: 'all', label: 'All jobs', hint: 'Show full schedule' },
    { id: 'unassigned', label: 'Unassigned', hint: 'Needs a crew member' },
    { id: 'today', label: 'Today', hint: 'Only jobs dated today' },
  ]

  return (
    <div className={`${cal.panel} p-3.5`}>
      <p className={cal.sectionLabel}>Quick filters</p>
      <p className={`mt-1 text-[12px] leading-snug ${cal.textMuted}`}>
        Narrow the grid without opening advanced filters.
      </p>
      <div className="mt-3 flex flex-col gap-1.5" role="group" aria-label="Quick filters">
        {items.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              title={item.hint}
              onClick={() => onChange(item.id)}
              className={`rounded-xl border px-2.5 py-2 text-left text-[13px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                isActive
                  ? 'border-emerald-400/70 bg-emerald-50/95 text-emerald-950 shadow-sm ring-1 ring-emerald-200/80 dark:border-emerald-600/45 dark:bg-emerald-950/55 dark:text-emerald-100 dark:ring-emerald-800/70'
                  : `border-slate-200/80 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800`
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
