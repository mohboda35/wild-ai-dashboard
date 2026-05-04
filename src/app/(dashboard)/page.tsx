'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, startOfDay, endOfDay } from 'date-fns'
import { PhoneCall, TrendingUp, Clock, Phone, Calendar, AlertCircle } from 'lucide-react'
import { supabase, DEFAULT_BUSINESS_ID } from '@/lib/supabase'
import { formatTime, getGreeting } from '@/lib/utils'
import type { Call, Booking, Business } from '@/lib/types'
import StatCard from '@/components/ui/StatCard'
import { SkeletonCard } from '@/components/ui/Skeleton'

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-blue-500',
  confirmed: 'bg-green-500',
  cancelled: 'bg-red-400',
  completed: 'bg-gray-300',
}

export default function OverviewPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [todayCalls, setTodayCalls] = useState<Call[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [retellMinutes, setRetellMinutes] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const today = new Date()
    const [bizRes, callsRes, bookingsRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', DEFAULT_BUSINESS_ID).single(),
      supabase
        .from('calls')
        .select('*')
        .eq('business_id', DEFAULT_BUSINESS_ID)
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString()),
      supabase
        .from('bookings')
        .select('*')
        .eq('business_id', DEFAULT_BUSINESS_ID)
        .gt('start_time', new Date().toISOString())
        .in('status', ['scheduled', 'confirmed'])
        .order('start_time')
        .limit(5),
    ])

    if (bizRes.data) setBusiness(bizRes.data)
    if (callsRes.data) setTodayCalls(callsRes.data)
    if (bookingsRes.data) setUpcomingBookings(bookingsRes.data)

    // Fetch today's minutes from Retell API
    try {
      const retellRes = await fetch('/api/retell/usage?period=today')
      if (retellRes.ok) {
        const retellData = await retellRes.json()
        if (typeof retellData.totalMinutes === 'number') {
          setRetellMinutes(retellData.totalMinutes)
        }
      }
    } catch {
      // Retell API unavailable — leave retellMinutes null
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const totalCalls = todayCalls.length
  const bookedCalls = todayCalls.filter((c) => c.booked).length
  const bookingRate = totalCalls > 0 ? Math.round((bookedCalls / totalCalls) * 100) : 0
  const actionRequired = todayCalls.filter((c) => !c.booked && c.intent === 'booking')

  // Prefer Retell minutes; fall back to Supabase duration sum
  const totalMinutes = retellMinutes !== null
    ? retellMinutes
    : parseFloat(
        (todayCalls.reduce((a, c) => a + (c.call_duration_seconds ?? 0), 0) / 60).toFixed(1)
      )

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="rounded-2xl bg-gray-100 animate-pulse h-[80px]" />
        <div className="grid grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 h-52 animate-pulse" />
          <div className="bg-white rounded-2xl border border-gray-100 h-52 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 page-fade-in">
      {/* Hero Banner */}
      <div className="rounded-2xl overflow-hidden relative shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6]" />
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/[0.06] blur-2xl" />
        <div className="absolute -bottom-8 right-16 w-36 h-36 rounded-full bg-white/[0.05] blur-xl" />
        <div className="relative p-7 text-white">
          <h1 className="text-xl font-bold">
            {getGreeting()}, {business?.owner_name ?? 'there'}! 👋
          </h1>
          <p className="text-blue-200/80 mt-0.5 text-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
            {business?.name && <span className="text-blue-300/60"> &mdash; {business.name}</span>}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Calls Today"
          value={totalCalls}
          icon={<PhoneCall size={18} />}
        />
        <StatCard
          title="Booking Rate"
          value={`${bookingRate}%`}
          subtitle={`${bookedCalls} of ${totalCalls} calls booked`}
          icon={<TrendingUp size={18} />}
          color={bookingRate >= 50 ? 'text-green-600' : 'text-orange-500'}
        />
        <StatCard
          title="Total Minutes Today"
          value={`${totalMinutes} mins`}
          subtitle={retellMinutes !== null ? 'via Retell AI' : 'via call records'}
          icon={<Clock size={18} />}
        />
      </div>

      {/* Two-column below */}
      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Upcoming Bookings</h2>
          {upcomingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                <Calendar size={16} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">No upcoming bookings</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcomingBookings.map((b) => (
                <li key={b.id} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[b.status] ?? 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{b.contact_name}</p>
                    <p className="text-xs text-gray-400 truncate">{b.service_type}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 tabular-nums">{formatTime(b.start_time)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Action Required */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Action Required</h2>
            {actionRequired.length > 0 && (
              <span className="text-[11px] bg-red-50 text-red-600 ring-1 ring-red-200 px-2 py-0.5 rounded-full font-semibold">
                {actionRequired.length}
              </span>
            )}
          </div>
          {actionRequired.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-3">
                <AlertCircle size={16} className="text-green-400" />
              </div>
              <p className="text-sm text-gray-400">No missed booking opportunities</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {actionRequired.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.caller_name ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{c.caller_phone} &middot; {formatTime(c.created_at)}</p>
                  </div>
                  <a
                    href={`tel:${c.caller_phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shrink-0"
                  >
                    <Phone size={11} />
                    Call Back
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
