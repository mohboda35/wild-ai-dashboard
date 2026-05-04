'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { subMonths, format } from 'date-fns'
import Spinner from '@/components/ui/Spinner'
import { CreditCard, Activity, Zap, Clock } from 'lucide-react'
import type { Business } from '@/lib/types'

const MINUTE_QUOTA = 1000

interface MonthUsage {
  month: string      // 'Jan 2026'
  calls: number
  minutes: number
}

interface RetellUsage {
  totalMinutes: number
  totalCalls: number
  agentId: string | null
}

export default function BillingPage() {
  const { profile } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBizId, setSelectedBizId] = useState<string>('')
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null)
  const [thisMonth, setThisMonth] = useState<RetellUsage | null>(null)
  const [history, setHistory] = useState<MonthUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)

  const isSuperAdmin = profile?.role === 'super_admin'

  // Load businesses list (super admin only) or set from profile
  useEffect(() => {
    if (!profile) return
    if (isSuperAdmin) {
      supabase.from('businesses').select('*').order('name').then(({ data }) => {
        if (data) {
          setBusinesses(data)
          if (data.length > 0 && !selectedBizId) {
            setSelectedBizId(data[0].id)
          }
        }
      })
    } else if (profile.business_id) {
      setSelectedBizId(profile.business_id)
    }
  }, [profile, isSuperAdmin])

  const loadBillingData = useCallback(async (bizId: string) => {
    if (!bizId) return
    setLoading(true)

    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', bizId)
      .single()
    setSelectedBiz(biz ?? null)

    // Fetch this month's usage from Retell
    try {
      const res = await fetch(`/api/retell/usage?period=today`)
      // Actually use month start
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const monthRes = await fetch(`/api/retell/usage?since=${encodeURIComponent(monthStart)}`)
      if (monthRes.ok) {
        const data = await monthRes.json()
        setThisMonth(data)
      }
    } catch {
      setThisMonth(null)
    }

    // Build usage history for last 6 months from Supabase call_duration_seconds
    setHistoryLoading(true)
    const monthHistory: MonthUsage[] = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i)
      const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString()
      const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1).toISOString()
      const { data } = await supabase
        .from('calls')
        .select('call_duration_seconds')
        .eq('business_id', bizId)
        .gte('created_at', start)
        .lt('created_at', end)
      const calls = data ?? []
      const totalSecs = calls.reduce((s, c) => s + (c.call_duration_seconds ?? 0), 0)
      monthHistory.push({
        month: format(monthDate, 'MMM yyyy'),
        calls: calls.length,
        minutes: parseFloat((totalSecs / 60).toFixed(1)),
      })
    }
    setHistory(monthHistory)
    setHistoryLoading(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedBizId) loadBillingData(selectedBizId)
  }, [selectedBizId, loadBillingData])

  const usedMinutes = thisMonth?.totalMinutes ?? 0
  const progressPct = Math.min(100, Math.round((usedMinutes / MINUTE_QUOTA) * 100))
  const progressColor = progressPct >= 90 ? 'bg-red-500' : progressPct >= 70 ? 'bg-orange-400' : 'bg-blue-500'

  return (
    <div className="p-6 space-y-6 page-fade-in max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usage &amp; Billing</h1>
          <p className="text-xs text-gray-400 mt-0.5">Monitor AI call minutes and plan usage</p>
        </div>
        {isSuperAdmin && businesses.length > 0 && (
          <select
            value={selectedBizId}
            onChange={(e) => setSelectedBizId(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Plan & Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CreditCard size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Starter Plan</p>
                  <p className="text-xs text-gray-400">{selectedBiz?.name ?? '—'}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
                Active
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">
                  {usedMinutes} / {MINUTE_QUOTA} minutes used this month
                </span>
                <span className={`font-semibold text-xs ${progressPct >= 90 ? 'text-red-600' : progressPct >= 70 ? 'text-orange-500' : 'text-blue-600'}`}>
                  {progressPct}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${progressColor}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{MINUTE_QUOTA - usedMinutes} minutes remaining</p>
            </div>
          </div>

          {/* This Month Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Calls This Month</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{thisMonth?.totalCalls ?? 0}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Minutes This Month</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{usedMinutes}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Agent ID</span>
              </div>
              <p className="text-sm font-mono text-gray-600 truncate">
                {selectedBiz?.retell_agent_id
                  ? selectedBiz.retell_agent_id.slice(0, 16) + '…'
                  : <span className="text-gray-300 italic">Not configured</span>}
              </p>
            </div>
          </div>

          {/* Usage History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Usage History</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months — from call records</p>
            </div>
            {historyLoading ? (
              <div className="flex items-center justify-center h-32"><Spinner /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50/70 border-b border-gray-100">
                  <tr>
                    {['Month', 'Calls', 'Minutes', 'Quota Used'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((row) => {
                    const pct = Math.min(100, Math.round((row.minutes / MINUTE_QUOTA) * 100))
                    return (
                      <tr key={row.month} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">{row.month}</td>
                        <td className="px-5 py-3 text-gray-600 tabular-nums">{row.calls}</td>
                        <td className="px-5 py-3 text-gray-600 tabular-nums">{row.minutes}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[100px]">
                              <div
                                className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-orange-400' : 'bg-blue-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 tabular-nums">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Stripe placeholder */}
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6 text-center">
            <CreditCard size={24} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Stripe billing coming soon</p>
            <p className="text-xs text-gray-400 mt-1">Subscription management and invoices will appear here once Stripe is enabled.</p>
          </div>
        </>
      )}
    </div>
  )
}
