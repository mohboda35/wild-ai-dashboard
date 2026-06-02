import { format, formatDistanceToNow } from 'date-fns'

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy')
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a')
}

export function formatTime(dateStr: string): string {
  return format(new Date(dateStr), 'h:mm a')
}

export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function sentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'text-green-700 bg-green-50 ring-1 ring-green-200'
    case 'negative': return 'text-red-700 bg-red-50 ring-1 ring-red-200'
    default: return 'text-amber-700 bg-amber-50 ring-1 ring-amber-200'
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'completed': return 'text-slate-600 bg-slate-100 ring-1 ring-slate-200'
    case 'missed': return 'text-red-700 bg-red-50 ring-1 ring-red-200'
    case 'voicemail': return 'text-violet-700 bg-violet-50 ring-1 ring-violet-200'
    case 'confirmed': return 'text-green-700 bg-green-50 ring-1 ring-green-200'
    case 'scheduled': return 'text-blue-700 bg-blue-50 ring-1 ring-blue-200'
    case 'cancelled': return 'text-red-700 bg-red-50 ring-1 ring-red-200'
    default: return 'text-slate-600 bg-slate-100 ring-1 ring-slate-200'
  }
}

export function intentColor(intent: string): string {
  switch (intent) {
    case 'booking': return 'text-blue-700 bg-blue-50 ring-1 ring-blue-200'
    case 'inquiry': return 'text-indigo-700 bg-indigo-50 ring-1 ring-indigo-200'
    case 'reschedule': return 'text-orange-700 bg-orange-50 ring-1 ring-orange-200'
    case 'cancel': return 'text-red-700 bg-red-50 ring-1 ring-red-200'
    default: return 'text-slate-600 bg-slate-100 ring-1 ring-slate-200'
  }
}
