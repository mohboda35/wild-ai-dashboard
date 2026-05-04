interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: string
}

export default function StatCard({ title, value, subtitle, icon, color = 'text-blue-600' }: StatCardProps) {
  const iconBg = color.includes('green') ? 'bg-green-50 text-green-600'
    : color.includes('orange') ? 'bg-orange-50 text-orange-600'
    : color.includes('red') ? 'bg-red-50 text-red-600'
    : color.includes('purple') ? 'bg-purple-50 text-purple-600'
    : 'bg-blue-50 text-blue-600'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className={`text-2xl font-bold mt-1.5 tabular-nums ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>{icon}</div>
        )}
      </div>
    </div>
  )
}
