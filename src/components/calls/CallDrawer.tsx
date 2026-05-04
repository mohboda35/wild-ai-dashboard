'use client'

import { X, Phone, Clock, MessageSquare, FileText, CheckCircle2 } from 'lucide-react'
import type { Call } from '@/lib/types'
import { sentimentColor, statusColor } from '@/lib/utils'
import { formatDate, secondsToMinutes, intentBadgeColor } from '@/lib/utils/format'
import Badge from '@/components/ui/Badge'

interface CallDrawerProps {
  call: Call
  onClose: () => void
}

export default function CallDrawer({ call, onClose }: CallDrawerProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl shadow-black/10 z-50 flex flex-col drawer-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 tabular-nums">{call.caller_phone ?? 'Unknown'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(call.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge label={call.call_status} className={statusColor(call.call_status)} />
            <Badge label={call.intent} className={intentBadgeColor(call.intent)} />
            <Badge label={call.sentiment} className={sentimentColor(call.sentiment)} />
            {call.booked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
                <CheckCircle2 size={11} />
                Booked
              </span>
            )}
          </div>

          {/* Caller Info */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Call Info</h3>
            {call.caller_phone && (
              <div className="flex items-center gap-2.5 text-sm text-gray-700">
                <Phone size={13} className="text-gray-400 shrink-0" />
                <a href={`tel:${call.caller_phone}`} className="hover:text-blue-600 transition-colors tabular-nums font-medium">
                  {call.caller_phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm text-gray-700">
              <Clock size={13} className="text-gray-400 shrink-0" />
              Duration: {secondsToMinutes(call.call_duration_seconds)}
            </div>
          </div>

          {/* Linked Booking */}
          {call.bookings && (
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <h3 className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider mb-2">Linked Booking</h3>
              <p className="text-sm font-medium text-gray-900">{call.bookings.service_type ?? 'Service'}</p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(call.bookings.start_time)}</p>
              <Badge label={call.bookings.status} className={`mt-2 ${statusColor(call.bookings.status)}`} />
            </div>
          )}

          {/* AI Summary */}
          {call.call_summary && (
            <div>
              <h3 className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                <MessageSquare size={11} /> AI Summary
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-2xl p-4">{call.call_summary}</p>
            </div>
          )}

          {/* Transcript */}
          {call.call_transcript && (
            <div>
              <h3 className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                <FileText size={11} /> Transcript
              </h3>
              <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-2xl p-4 whitespace-pre-wrap max-h-72 overflow-y-auto font-mono">
                {call.call_transcript}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
