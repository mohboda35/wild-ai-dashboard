'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, DEFAULT_BUSINESS_ID } from '@/lib/supabase'
import { sentimentColor, statusColor } from '@/lib/utils'
import { formatDate, intentBadgeColor } from '@/lib/utils/format'
import type { Call } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import { SkeletonTableRow } from '@/components/ui/Skeleton'
import CallDrawer from '@/components/calls/CallDrawer'
import { Search, ChevronLeft, ChevronRight, PhoneCall } from 'lucide-react'

const PAGE_SIZE = 20

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterIntent, setFilterIntent] = useState('')
  const [filterSentiment, setFilterSentiment] = useState('')
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('calls')
      .select('*, contacts(*), bookings(*)', { count: 'exact' })
      .eq('business_id', DEFAULT_BUSINESS_ID)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (search) {
      query = query.or(`caller_name.ilike.%${search}%,caller_phone.ilike.%${search}%`)
    }
    if (filterStatus) query = query.eq('call_status', filterStatus)
    if (filterIntent) query = query.eq('intent', filterIntent)
    if (filterSentiment) query = query.eq('sentiment', filterSentiment)

    const { data, count } = await query
    setCalls(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, search, filterStatus, filterIntent, filterSentiment])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-4 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Calls</h1>
          <p className="text-xs text-gray-400 mt-0.5">{total} total records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {[
          { value: filterStatus, setter: setFilterStatus, options: [['', 'All Statuses'], ['completed', 'Completed'], ['missed', 'Missed'], ['voicemail', 'Voicemail']] },
          { value: filterIntent, setter: setFilterIntent, options: [['', 'All Intents'], ['booking', 'Booking'], ['book', 'Book'], ['inquiry', 'Inquiry'], ['question', 'Question'], ['reschedule', 'Reschedule'], ['cancel', 'Cancel'], ['emergency', 'Emergency'], ['other', 'Other']] },
          { value: filterSentiment, setter: setFilterSentiment, options: [['', 'All Sentiments'], ['positive', 'Positive'], ['neutral', 'Neutral'], ['negative', 'Negative']] },
        ].map(({ value, setter, options }, idx) => (
          <select
            key={idx}
            value={value}
            onChange={(e) => { setter(e.target.value); setPage(0) }}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {options.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {calls.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
              <PhoneCall size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No calls found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search || filterStatus || filterIntent || filterSentiment
                ? 'Try adjusting your filters'
                : 'Calls will appear here once your AI agent receives them'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                {['Phone', 'Transcript', 'Date', 'Intent', 'Sentiment', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} cols={7} />)
                : calls.map((call) => (
                    <tr
                      key={call.id}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                      onClick={() => setSelectedCall(call)}
                    >
                      <td className="px-4 py-3 text-gray-700 tabular-nums whitespace-nowrap font-medium">
                        {call.caller_phone ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[260px]">
                        <span className="truncate block">
                          {call.call_transcript
                            ? call.call_transcript.slice(0, 100) + (call.call_transcript.length > 100 ? '…' : '')
                            : <span className="text-gray-300 italic">No transcript</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs tabular-nums">
                        {formatDate(call.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={call.intent} className={intentBadgeColor(call.intent)} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={call.sentiment} className={sentimentColor(call.sentiment)} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={call.call_status} className={statusColor(call.call_status)} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-blue-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {selectedCall && (
        <CallDrawer call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  )
}
