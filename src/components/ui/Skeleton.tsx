export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-md ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
      <SkeletonLine className="h-3 w-20" />
      <SkeletonLine className="h-7 w-14" />
      <SkeletonLine className="h-2.5 w-28" />
    </div>
  )
}

export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  const widths = ['w-28', 'w-24', 'w-20', 'w-16', 'w-14', 'w-12', 'w-10', 'w-8']
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`animate-pulse bg-gray-100 rounded h-4 ${widths[i % widths.length]}`} />
        </td>
      ))}
    </tr>
  )
}
