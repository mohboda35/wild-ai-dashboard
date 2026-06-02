'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, DEFAULT_BUSINESS_ID } from '@/lib/supabase'
import { subDays } from 'date-fns'
import Spinner from '@/components/ui/Spinner'
import StatCard from '@/components/ui/StatCard'
import { PhoneCall, TrendingUp, Clock, Target } from 'lucide-react'

const DAYS = [30, 60, 90]

interface CallSlice {
  booked: boolean | null
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [calls, setCalls] = useState<CallSlice[]>([])
  const [loading, setLoading] = useState(true)
  const [retellMinutes, setRetellMinutes] = useState<number | null>(null)
  const [retellLoading, setRetellLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setRetellMinutes(null)

    const since = subDays(new Date(), days).toISOString()

    // Supabase: only need booked field for booking rate
    const { data } = await supabase
      .from('calls')
      .select('booked')
      .eq('business_id', DEFAULT_BUSINESS_ID)
      .gte('created_at', since)
    setCalls(data ?? [])

    // Retell: total minutes for the period
    setRetellLoading(true)
    try {
      const retellRes = await fetch(`/api/retell/usage?since=${encodeURIComponent(since)}`)
      if (retellRes.ok) {
        const retellData = await retellRes.json()
        if (typeof retellData.totalMinutes === 'number') {
          setRetellMinutes(retellData.totalMinutes)
        }
      }
    } catch {
      // Leave null
    } finally {
      setRetellLoading(false)
    }

    setLoading(false)
  }, [days])

  useEffect(() => { load() }, [load])

  const totalCalls = calls.length
  const totalBooked = calls.filter((c) => c.booked).length
  const bookingRate = totalCalls > 0 ? Math.round((totalBooked / totalCalls) * 100) : 0
  const displayMinutes = retellMinutes !== null ? `${retellMinutes} mins` : retellLoading ? '…' : '—'

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }

  return (
    <div className="p-6 space-y-6 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Last {days} days</p>
        </div>
        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                days === d
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Calls"
          value={totalCalls}
          icon={<PhoneCall size={18} />}
        />
        <StatCard
          title="Total Minutes"
          value={displayMinutes}
          subtitle="via Retell AI"
          icon={<Clock size={18} />}
        />
        <StatCard
          title="Total Bookings"
          value={totalBooked}
          icon={<Target size={18} />}
          color="text-green-600"
        />
        <StatCard
          title="Booking Rate"
          value={`${bookingRate}%`}
          icon={<TrendingUp size={18} />}
          color={bookingRate >= 50 ? 'text-green-600' : 'text-orange-500'}
        />
      </div>
    </div>
  )
}
