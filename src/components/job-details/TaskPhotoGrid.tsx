import { format } from 'date-fns'
import { parseISO } from 'date-fns'
import { useMemo, useState } from 'react'
import type { TaskPhoto } from '../../types'
import { taskPhotoRevisionKey } from '../../lib/taskPhotoDisplay'
import {
  PHOTO_LABEL_COPY,
  PHOTO_LABEL_IDS,
  type PhotoLabelId,
  photoLabelBadgeClass,
} from '../../lib/taskPhotoLabels'
import { sortTaskPhotosNewestFirst } from '../../lib/taskPhotoUtils'

function formatTs(iso: string) {
  try {
    return format(parseISO(iso), 'MMM d · h:mm a')
  } catch {
    return iso
  }
}

function PhotoCard({
  p,
  onPhotoClick,
  onEditPhoto,
  canEdit,
}: {
  p: TaskPhoto
  onPhotoClick?: (p: TaskPhoto) => void
  onEditPhoto?: (p: TaskPhoto) => void
  canEdit?: boolean
}) {
  return (
    <li className="min-w-0">
      <div className="overflow-hidden rounded-3xl border-2 border-slate-200/90 bg-white text-left shadow-xl shadow-slate-900/[0.1] dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
        <button
          type="button"
          onClick={() => onPhotoClick?.(p)}
          className={`group relative block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
            onPhotoClick ? '' : 'pointer-events-none'
          }`}
        >
          <div className="relative aspect-[4/3] min-h-[220px] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 sm:min-h-[280px]">
            <img
              key={taskPhotoRevisionKey(p)}
              src={p.image_url}
              alt={p.note.trim() ? p.note : `${PHOTO_LABEL_COPY[p.label]} photo`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <span
              className={`absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${photoLabelBadgeClass(p.label)}`}
            >
              {PHOTO_LABEL_COPY[p.label]}
            </span>
          </div>
        </button>

        {canEdit && onEditPhoto ? (
          <div className="border-b border-emerald-200/80 bg-gradient-to-r from-emerald-50/95 to-emerald-50/70 px-3 py-2.5 dark:border-emerald-900/50 dark:from-emerald-950/50 dark:to-emerald-950/35">
            <button
              type="button"
              onClick={() => onEditPhoto(p)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-[15px] font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-50 dark:shadow-emerald-950/40 dark:focus-visible:ring-offset-slate-900"
            >
              <span className="text-lg" aria-hidden>
                ✎
              </span>
              Edit photo
            </button>
          </div>
        ) : null}

        <div className="space-y-3 p-4 sm:p-5">
          {p.note.trim() ? (
            <p className="text-[16px] font-semibold leading-snug text-slate-900 dark:text-gray-100">{p.note}</p>
          ) : (
            <p className="text-[15px] italic text-slate-400 dark:text-gray-500">No note</p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
            <span className="font-semibold text-slate-800 dark:text-gray-200">{p.uploaded_by}</span>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden>
              ·
            </span>
            <time className="tabular-nums text-slate-500 dark:text-gray-400" dateTime={p.created_at}>
              {formatTs(p.created_at)}
            </time>
            {p.updated_at ? (
              <>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                  ·
                </span>
                <span className="text-xs text-slate-500 dark:text-gray-500">
                  Updated {formatTs(p.updated_at)}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}

export function TaskPhotoGrid({
  photos,
  onPhotoClick,
  onEditPhoto,
  canEdit,
}: {
  photos: TaskPhoto[]
  onPhotoClick?: (p: TaskPhoto) => void
  onEditPhoto?: (p: TaskPhoto) => void
  canEdit?: boolean
}) {
  const [filter, setFilter] = useState<PhotoLabelId | 'all'>('all')

  const sorted = useMemo(() => sortTaskPhotosNewestFirst(photos), [photos])

  const filtered = useMemo(() => {
    if (filter === 'all') return sorted
    return sorted.filter((p) => p.label === filter)
  }, [sorted, filter])

  const grouped = useMemo(() => {
    return PHOTO_LABEL_IDS.map((id) => ({
      id,
      label: PHOTO_LABEL_COPY[id],
      photos: sortTaskPhotosNewestFirst(sorted.filter((p) => p.label === id)),
    })).filter((g) => g.photos.length > 0)
  }, [sorted])

  if (sorted.length === 0) return null

  const filterId = 'task-photo-filter'

  const cardProps = { onPhotoClick, onEditPhoto, canEdit }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p id={filterId} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-gray-400">
          Filter by label
        </p>
        <div
          className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 pt-0.5 sm:mx-0 sm:flex-wrap sm:justify-end"
          role="tablist"
          aria-labelledby={filterId}
        >
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
              filter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({sorted.length})
          </button>
          {PHOTO_LABEL_IDS.map((id) => {
            const n = sorted.filter((p) => p.label === id).length
            if (n === 0) return null
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                onClick={() => setFilter(id)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
                  filter === id
                    ? 'ring-2 ring-emerald-500/80 ' + photoLabelBadgeClass(id)
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {PHOTO_LABEL_COPY[id]} ({n})
              </button>
            )
          })}
        </div>
      </div>

      {filter === 'all' ? (
        <div className="space-y-8">
          {grouped.map((g) => (
            <section key={g.id} aria-label={g.label}>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-gray-200">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${photoLabelBadgeClass(g.id)}`}
                >
                  {g.label}
                </span>
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span className="font-medium text-slate-500 dark:text-gray-400">{g.photos.length} photo(s)</span>
              </h4>
              <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {g.photos.map((p) => (
                  <PhotoCard key={p.id} p={p} {...cardProps} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filtered.map((p) => (
            <PhotoCard key={p.id} p={p} {...cardProps} />
          ))}
        </ul>
      )}
    </div>
  )
}
