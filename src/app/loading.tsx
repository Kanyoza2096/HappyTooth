export default function GlobalLoading() {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 px-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
    </div>
  );
}
