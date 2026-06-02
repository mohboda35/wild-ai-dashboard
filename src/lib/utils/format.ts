import { format } from 'date-fns'

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MM-dd-yyyy')
}

export function secondsToMinutes(seconds: number | null | undefined): string {
  if (!seconds || seconds === 0) return '0 mins'
  return `${(seconds / 60).toFixed(1)} mins`
}

export function intentBadgeColor(intent: string): string {
  switch (intent) {
    case 'book':        return 'text-blue-700 bg-blue-50 ring-1 ring-blue-200'
    case 'reschedule':  return 'text-orange-700 bg-orange-50 ring-1 ring-orange-200'
    case 'cancel':      return 'text-red-700 bg-red-50 ring-1 ring-red-200'
    case 'question':    return 'text-indigo-700 bg-indigo-50 ring-1 ring-indigo-200'
    case 'emergency':   return 'text-rose-700 bg-rose-50 ring-1 ring-rose-200'
    // legacy values
    case 'booking':     return 'text-blue-700 bg-blue-50 ring-1 ring-blue-200'
    case 'inquiry':     return 'text-indigo-700 bg-indigo-50 ring-1 ring-indigo-200'
    default:            return 'text-slate-600 bg-slate-100 ring-1 ring-slate-200'
  }
}
