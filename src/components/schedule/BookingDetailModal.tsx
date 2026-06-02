'use client'

import { X } from 'lucide-react'
import type { Booking } from '@/lib/types'
import { formatDateTime, statusColor } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

interface Props {
  booking: Booking
  onClose: () => void
}

export default function BookingDetailModal({ booking, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Booking Details</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Contact</p>
              <p className="text-gray-900 font-semibold mt-1">{booking.contact_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Service</p>
              <p className="text-gray-900 mt-1">{booking.service_type ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Start</p>
              <p className="text-gray-900 mt-1">{formatDateTime(booking.start_time)}</p>
            </div>
            {booking.end_time && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">End</p>
                <p className="text-gray-900 mt-1">{formatDateTime(booking.end_time)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Status</p>
              <Badge label={booking.status} className={`mt-1 ${statusColor(booking.status)}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Source</p>
              <p className="text-gray-900 mt-1 capitalize">{booking.source.replace('_', ' ')}</p>
            </div>
            {booking.notes && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Notes</p>
                <p className="text-gray-700 mt-1">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
