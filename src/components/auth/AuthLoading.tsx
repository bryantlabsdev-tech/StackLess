export function AuthLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-gray-400">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
        aria-hidden
      />
      <p className="text-sm">Loading…</p>
    </div>
  )
}
