'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase, DEFAULT_BUSINESS_ID } from '@/lib/supabase'
import Spinner from '@/components/ui/Spinner'

interface Props {
  onClose: () => void
}

export default function BookingModal({ onClose }: Props) {
  const [form, setForm] = useState({
    contact_name: '',
    service_type: '',
    start_time: '',
    end_time: '',
    notes: '',
    status: 'scheduled',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function save() {
    if (!form.contact_name.trim() || !form.start_time) {
      setError('Contact name and start time are required')
      return
    }
    setSaving(true)
    const { error: err } = await supabase.from('bookings').insert({
      contact_name: form.contact_name,
      service_type: form.service_type || null,
      start_time: form.start_time,
      end_time: form.end_time || null,
      notes: form.notes || null,
      status: form.status,
      source: 'manual',
      business_id: DEFAULT_BUSINESS_ID,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Add Booking</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {[
              { label: 'Contact Name *', field: 'contact_name', type: 'text' },
              { label: 'Service Type', field: 'service_type', type: 'text' },
              { label: 'Start Time *', field: 'start_time', type: 'datetime-local' },
              { label: 'End Time', field: 'end_time', type: 'datetime-local' },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => update(field, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
          <div className="px-6 pb-6 flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">Cancel</button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Spinner size="sm" />}
              Save Booking
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
