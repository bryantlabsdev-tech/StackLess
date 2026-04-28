import { useEffect, useMemo, useRef, useState } from 'react'
import type { JobChecklistItem } from '../../types'
import { Button } from '../ui/Button'

function sorted(items: JobChecklistItem[]) {
  return [...items].sort((a, b) => a.order_index - b.order_index)
}

function renumber(list: JobChecklistItem[]): JobChecklistItem[] {
  return sorted(list).map((c, i) => ({ ...c, order_index: i }))
}

export function JobFormChecklistSection({
  items,
  contextJobId,
  onChange,
}: {
  items: JobChecklistItem[]
  contextJobId: string
  onChange: (next: JobChecklistItem[]) => void
}) {
  const sortedItems = useMemo(() => sorted(items), [items])
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

  const commit = (next: JobChecklistItem[]) => {
    onChange(renumber(next))
  }

  const addItem = () => {
    const title = draft.trim()
    if (!title) return
    const row: JobChecklistItem = {
      id: crypto.randomUUID(),
      job_id: contextJobId,
      title,
      is_completed: false,
      order_index: sortedItems.length,
    }
    commit([...items, row])
    setDraft('')
  }

  const updateTitle = (id: string, title: string) => {
    const t = title.trim()
    if (!t) return
    commit(items.map((c) => (c.id === id ? { ...c, title: t } : c)))
  }

  const removeItem = (id: string) => {
    if (!window.confirm('Remove this checklist item?')) return
    commit(items.filter((c) => c.id !== id))
  }

  const startEdit = (item: JobChecklistItem) => {
    setEditingId(item.id)
    setEditDraft(item.title)
  }

  const commitEdit = () => {
    if (!editingId) return
    const t = editDraft.trim()
    if (t) updateTitle(editingId, t)
    setEditingId(null)
  }

  const cancelEdit = () => {
    skipBlurCommit.current = true
    setEditingId(null)
  }

  return (
    <section className="min-w-0 shrink-0 rounded-[18px] border border-slate-200 bg-slate-50/50 p-3 dark:border-[#1F2A36] dark:bg-[#11161D]">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">Closing checklist</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-[#94A3B8]">
          Crew checks these off on the job screen before completing the visit. Edit the list here.
        </p>
      </div>

      <div className="mt-3 max-h-[200px] min-h-0 overflow-y-auto overscroll-contain rounded-lg border border-slate-200/70 bg-white/60 dark:border-[#1F2A36] dark:bg-[#151B23]/60">
        {sortedItems.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-slate-500 dark:text-[#94A3B8]">No items yet — add one below.</p>
        ) : (
          <ul className="space-y-2.5 px-2 py-2 sm:px-2.5 sm:py-2.5">
            {sortedItems.map((item) => {
              const isEditing = editingId === item.id
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white/80 px-2.5 py-2 dark:border-[#1F2A36] dark:bg-[#151B23]/80 sm:gap-2.5 sm:px-3 sm:py-2.5"
                >
                  <div className="min-w-0 flex-1">
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
                        className="w-full rounded-md border border-emerald-400/60 bg-white px-2 py-1 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 dark:border-emerald-800 dark:bg-slate-900 dark:text-white"
                        aria-label="Edit checklist item"
                      />
                    ) : (
                      <p className="text-sm font-medium leading-snug text-slate-800 dark:text-slate-100">{item.title}</p>
                    )}
                    {item.is_completed ? (
                      <p className="mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        Completed on site (crew) — title can still be edited
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-md p-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label={`Edit “${item.title}”`}
                      >
                        Edit
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-md p-1.5 text-xs text-slate-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                      aria-label={`Remove “${item.title}”`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-2 flex min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem()
            }
          }}
          placeholder="Add checklist item…"
          className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-slate-500"
          aria-label="New checklist item title"
        />
        <Button
          type="button"
          variant="primary"
          className="shrink-0 rounded-none px-3 py-2 text-xs sm:text-sm"
          disabled={!draft.trim()}
          onClick={addItem}
        >
          Add
        </Button>
      </div>
    </section>
  )
}
