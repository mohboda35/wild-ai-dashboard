'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { subDays } from 'date-fns'
import Spinner from '@/components/ui/Spinner'
import StatCard from '@/components/ui/StatCard'
import { Building2, PhoneCall, CalendarCheck } from 'lucide-react'
import type { Business } from '@/lib/types'

interface BusinessStats extends Business {
  call_count: number
}

export default function AdminOverviewTab() {
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<BusinessStats[]>([])
  const [totalCalls, setTotalCalls] = useState(0)
  const [totalBookings, setTotalBookings] = useState(0)

  useEffect(() => {
    async function load() {
      const since = subDays(new Date(), 30).toISOString()

      const [bizRes, callsRes, bookingsRes] = await Promise.all([
        supabase.from('businesses').select('*').order('created_at', { ascending: false }),
        supabase.from('calls').select('id, business_id').gte('created_at', since),
        supabase.from('bookings').select('id').gte('created_at', since),
      ])

      const biz = bizRes.data ?? []
      const calls = callsRes.data ?? []
      const callCountByBiz: Record<string, number> = {}
      calls.forEach((c) => {
        callCountByBiz[c.business_id] = (callCountByBiz[c.business_id] ?? 0) + 1
      })

      setBusinesses(biz.map((b) => ({ ...b, call_count: callCountByBiz[b.id] ?? 0 })))
      setTotalCalls(calls.length)
      setTotalBookings((bookingsRes.data ?? []).length)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Businesses" value={businesses.length} icon={<Building2 size={18} />} />
        <StatCard title="Calls (Last 30 Days)" value={totalCalls} icon={<PhoneCall size={18} />} />
        <StatCard title="Bookings (Last 30 Days)" value={totalBookings} icon={<CalendarCheck size={18} />} color="text-green-600" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Businesses</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Business</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Industry</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Calls (30d)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {businesses.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-900">{b.name}</td>
                <td className="px-5 py-3 text-gray-600">{b.industry ?? '—'}</td>
                <td className="px-5 py-3 text-gray-600">{b.owner_name}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    b.is_active !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {b.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{b.call_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
