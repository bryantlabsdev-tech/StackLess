import { useEffect, useMemo, useRef, useState } from 'react'
import type { JobChecklistItem } from '../../types'
import { Button } from '../ui/Button'

function sortedChecklist(items: JobChecklistItem[]) {
  return [...items].sort((a, b) => a.order_index - b.order_index)
}

export function ChecklistSection({
  items,
  toggleDisabled,
  canManageStructure,
  onToggle,
  onAddItem,
  onUpdateTitle,
  onDeleteItem,
}: {
  items: JobChecklistItem[]
  toggleDisabled?: boolean
  canManageStructure: boolean
  onToggle: (itemId: string, is_completed: boolean) => void
  onAddItem: (title: string) => void
  onUpdateTitle: (itemId: string, title: string) => void
  onDeleteItem: (itemId: string) => void
}) {
  const sorted = useMemo(() => sortedChecklist(items), [items])
  const doneCount = useMemo(() => sorted.filter((c) => c.is_completed).length, [sorted])
  const total = sorted.length
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  const skipBlurCommit = useRef(false)

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const submitNew = () => {
    const t = draft.trim()
    if (!t) return
    onAddItem(t)
    setDraft('')
  }

  const startEdit = (item: JobChecklistItem) => {
    setEditingId(item.id)
    setEditDraft(item.title)
  }

  const commitEdit = () => {
    if (!editingId) return
    const t = editDraft.trim()
    if (t) onUpdateTitle(editingId, t)
    setEditingId(null)
  }

  const cancelEdit = () => {
    skipBlurCommit.current = true
    setEditingId(null)
  }

  const handleDelete = (itemId: string) => {
    if (window.confirm('Remove this checklist item?')) onDeleteItem(itemId)
  }

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
            Job checklist
          </h2>
          {canManageStructure ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-gray-400">
              Customize items for this job. Each line must be checked before the job can be completed.
            </p>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-gray-400">
              Check off each line when it’s done on site.
            </p>
          )}
        </div>
        <div
          className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tabular-nums text-slate-700 dark:bg-slate-800 dark:text-gray-300"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {doneCount} / {total}
        </div>
      </div>

      {total > 0 ? (
        <div className="mt-3" aria-hidden>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700/90">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-200 ease-out dark:bg-emerald-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : null}

      <ul className="mt-4 space-y-2">
        {sorted.map((item) => {
          const isEditing = editingId === item.id
          return (
            <li key={item.id}>
              <div
                className={`flex min-h-[48px] items-center gap-1 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 ${
                  canManageStructure && !isEditing
                    ? 'border-slate-100 pr-1 dark:border-slate-800'
                    : 'border-slate-100 dark:border-slate-800'
                }`}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-2.5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 sm:gap-3.5 sm:pl-4 sm:pr-2">
                  <input
                    type="checkbox"
                    checked={item.is_completed}
                    disabled={toggleDisabled}
                    onChange={(e) => onToggle(item.id, e.target.checked)}
                    className="h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 sm:h-6 sm:w-6"
                  />
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          commitEdit()
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          cancelEdit()
                        }
                      }}
                      onBlur={() => {
                        if (skipBlurCommit.current) {
                          skipBlurCommit.current = false
                          return
                        }
                        commitEdit()
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-emerald-400/70 bg-white px-2.5 py-1.5 text-[16px] font-medium leading-snug text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-emerald-800 dark:bg-slate-900 dark:text-gray-100"
                      aria-label="Edit checklist item title"
                    />
                  ) : (
                    <span className="min-w-0 flex-1 text-[16px] font-medium leading-snug text-gray-900 dark:text-gray-200">
                      {item.title}
                    </span>
                  )}
                </label>

                {canManageStructure && !isEditing ? (
                  <div className="flex shrink-0 items-center gap-0.5 pr-1">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-emerald-700 dark:hover:bg-slate-700/80 dark:hover:text-emerald-400"
                      title="Rename"
                      aria-label={`Rename “${item.title}”`}
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    {total > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                        title="Remove"
                        aria-label={`Remove “${item.title}”`}
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" x2="10" y1="11" y2="17" />
                          <line x1="14" x2="14" y1="11" y2="17" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      {canManageStructure ? (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            submitNew()
          }}
        >
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-emerald-600/60 dark:focus-within:ring-emerald-500/15">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a checklist item…"
              aria-label="New checklist item"
              className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-slate-500"
            />
            <Button
              type="submit"
              variant="primary"
              className="shrink-0 rounded-none px-4 py-2.5 text-sm"
              disabled={!draft.trim()}
            >
              Add
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
