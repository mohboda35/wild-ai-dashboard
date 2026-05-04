'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { supabase, DEFAULT_BUSINESS_ID } from '@/lib/supabase'
import type { Booking } from '@/lib/types'
import BookingDetailModal from '@/components/schedule/BookingDetailModal'
import { AlertCircle } from 'lucide-react'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
})

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#2563eb',
  confirmed: '#16a34a',
  cancelled: '#dc2626',
  completed: '#6b7280',
}

const GOOGLE_COLOR = '#7c3aed'

interface CalEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Booking | null
  color: string
  source: 'supabase' | 'google'
}

interface GoogleEvent {
  id: string
  title: string
  start: string
  end: string
  source: 'google'
}

export default function ScheduleClient() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([])
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [view, setView] = useState(Views.MONTH)
  const [date, setDate] = useState(new Date())

  const load = useCallback(async () => {
    const [supabaseRes, calRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, contacts(*)')
        .eq('business_id', DEFAULT_BUSINESS_ID)
        .order('start_time'),
      fetch('/api/calendar/events').catch(() => null),
    ])

    setBookings(supabaseRes.data ?? [])

    if (calRes && calRes.ok) {
      const calData = await calRes.json()
      setGoogleConnected(calData.connected ?? false)
      setGoogleEvents(calData.events ?? [])
    } else {
      setGoogleConnected(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const supabaseEvents: CalEvent[] = bookings.map((b) => ({
    id: b.id,
    title: `${b.contact_name ?? 'Unknown'} — ${b.service_type ?? 'Service'}`,
    start: new Date(b.start_time),
    end: b.end_time ? new Date(b.end_time) : new Date(new Date(b.start_time).getTime() + 60 * 60 * 1000),
    resource: b,
    color: STATUS_COLORS[b.status] ?? '#2563eb',
    source: 'supabase' as const,
  }))

  const gEvents: CalEvent[] = googleEvents.map((e) => ({
    id: `g-${e.id}`,
    title: e.title,
    start: new Date(e.start),
    end: new Date(e.end),
    resource: null,
    color: GOOGLE_COLOR,
    source: 'google' as const,
  }))

  const events = [...supabaseEvents, ...gEvents]

  return (
    <div className="p-6 space-y-4 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Schedule</h1>
          <p className="text-xs text-gray-400 mt-0.5">{bookings.length} bookings</p>
        </div>
      </div>

      {/* Google Calendar not connected notice */}
      {googleConnected === false && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-700">
          <AlertCircle size={15} className="shrink-0" />
          Google Calendar not connected. Add your calendar ID in Settings → Calendar.
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{status}</span>
          </div>
        ))}
        {googleConnected && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOOGLE_COLOR }} />
            <span>Google Calendar</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4" style={{ height: 640 }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          date={date}
          onView={(v) => setView(v as typeof view)}
          onNavigate={setDate}
          onSelectEvent={(e) => {
            const ev = e as CalEvent
            if (ev.source === 'supabase' && ev.resource) setSelected(ev.resource)
          }}
          eventPropGetter={(e) => ({
            style: {
              backgroundColor: (e as CalEvent).color,
              borderRadius: '6px',
              border: 'none',
              color: 'white',
              fontSize: '12px',
              padding: '2px 6px',
            },
          })}
          style={{ height: '100%' }}
        />
      </div>

      {selected && <BookingDetailModal booking={selected} onClose={() => { setSelected(null); load() }} />}
    </div>
  )
}
