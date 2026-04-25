export function PhotoUploadButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-400/90 bg-emerald-50/60 text-base font-semibold text-emerald-900 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:pointer-events-none disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/60"
    >
      <span className="text-xl leading-none" aria-hidden>
        +
      </span>
      Add photo
    </button>
  )
}
