'use client'

import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

const INDUSTRIES = ['HVAC', 'Garage Door', 'Plumbing', 'Roofing', 'Electrical', 'Landscaping', 'Other']
const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
]

interface Props {
  onClose: () => void
}

export default function AddClientModal({ onClose }: Props) {
  const [form, setForm] = useState({
    business_name: '',
    industry: '',
    owner_full_name: '',
    email: '',
    phone: '',
    timezone: 'America/Chicago',
    retell_agent_id: '',
    google_calendar_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function save() {
    const { business_name, owner_full_name, email, retell_agent_id } = form
    if (!business_name.trim() || !owner_full_name.trim() || !email.trim()) {
      setError('Business name, owner name, and email are required.')
      return
    }
    if (retell_agent_id.trim() && !retell_agent_id.trim().startsWith('agent_')) {
      setError('Retell Agent ID must start with "agent_".')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch('/api/admin/create-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to create client.')
      return
    }

    setSuccess(true)
    setTimeout(() => onClose(), 2000)
  }

  if (success) {
    return (
      <>
        <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Client added!</h2>
            <p className="text-sm text-gray-500 mt-2">Welcome email sent to {form.email}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Add New Client</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            {[
              { label: 'Business Name *', field: 'business_name', type: 'text' },
              { label: 'Owner Full Name *', field: 'owner_full_name', type: 'text' },
              { label: 'Email Address *', field: 'email', type: 'email' },
              { label: 'Phone', field: 'phone', type: 'tel' },
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
              <select
                value={form.industry}
                onChange={(e) => update('industry', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => update('timezone', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Integrations (optional)</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Retell Agent ID</label>
              <input
                type="text"
                placeholder="agent_xxxxxxxxxxxx"
                value={form.retell_agent_id}
                onChange={(e) => update('retell_agent_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Must start with &ldquo;agent_&rdquo;</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Google Calendar ID</label>
              <input
                type="text"
                placeholder="example@gmail.com or calendar ID"
                value={form.google_calendar_id}
                onChange={(e) => update('google_calendar_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-600">
              A welcome email with a password set link will be sent to the owner automatically.
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving && <Spinner size="sm" />}
              Create Client
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
