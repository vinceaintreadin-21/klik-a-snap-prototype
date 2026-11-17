export default function LayoutLoading() {
  return (
    <div role="status" className="flex flex-col items-center gap-3 text-sm font-medium text-slate-600">
      <span
        aria-hidden="true"
        className="size-9 rounded-full border-[3px] border-blue-100 border-t-[#004ac6] motion-safe:animate-spin"
      />
      Loading layouts…
    </div>
  )
}
