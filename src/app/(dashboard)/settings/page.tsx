'use client'

import { useEffect, useState } from 'react'
import { supabase, DEFAULT_BUSINESS_ID } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import Spinner from '@/components/ui/Spinner'
import { Save, Copy, Check, Mail, CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react'

const TABS = ['Business Info', 'Integration', 'Calendar', 'Notifications', 'Security'] as const
type Tab = typeof TABS[number]

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
]
const INDUSTRIES = ['HVAC', 'Garage Door', 'Plumbing', 'Roofing', 'Electrical', 'Landscaping', 'Other']

const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState<Tab>('Business Info')
  const [form, setForm] = useState({ name: '', owner_name: '', phone: '', timezone: '', industry: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [notifications, setNotifications] = useState({
    new_booking: true,
    missed_call: true,
    low_booking_rate: false,
    low_booking_threshold: 30,
  })

  // Calendar tab state
  const [calendarId, setCalendarId] = useState('')
  const [calendarSaving, setCalendarSaving] = useState(false)
  const [calendarSaved, setCalendarSaved] = useState(false)
  const [calStatus, setCalStatus] = useState<{ connected: boolean; serviceAccountEmail: string | null } | null>(null)
  const [calStatusLoading, setCalStatusLoading] = useState(false)

  useEffect(() => {
    supabase
      .from('businesses')
      .select('*')
      .eq('id', DEFAULT_BUSINESS_ID)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            name: data.name ?? '',
            owner_name: data.owner_name ?? '',
            phone: data.phone ?? '',
            timezone: data.timezone ?? 'America/New_York',
            industry: data.industry ?? '',
          })
          setCalendarId(data.google_calendar_id ?? '')
        }
      })
  }, [])

  // Load calendar connection status when Calendar tab is selected
  useEffect(() => {
    if (tab !== 'Calendar') return
    setCalStatusLoading(true)
    fetch('/api/calendar/events?check=true')
      .then((r) => r.json())
      .then((d) => setCalStatus({ connected: d.configured, serviceAccountEmail: d.serviceAccountEmail }))
      .catch(() => setCalStatus(null))
      .finally(() => setCalStatusLoading(false))
  }, [tab])

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function saveBusiness() {
    setSaving(true)
    await supabase.from('businesses').update(form).eq('id', DEFAULT_BUSINESS_ID)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function saveCalendar() {
    const bizId = profile?.business_id ?? DEFAULT_BUSINESS_ID
    setCalendarSaving(true)
    await supabase
      .from('businesses')
      .update({ google_calendar_id: calendarId.trim() || null })
      .eq('id', bizId)
    setCalendarSaving(false)
    setCalendarSaved(true)
    setTimeout(() => setCalendarSaved(false), 2000)
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/n8n`
    : '/api/webhooks/n8n'

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function sendPasswordReset() {
    if (!user?.email) return
    setResetLoading(true)
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetLoading(false)
    setResetSent(true)
    setTimeout(() => setResetSent(false), 4000)
  }

  return (
    <div className="p-6 max-w-3xl space-y-6 page-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manage your business profile and integrations</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Business Info */}
      {tab === 'Business Info' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Business Information</h2>
          {[
            { label: 'Business Name', field: 'name', type: 'text' },
            { label: 'Owner Name', field: 'owner_name', type: 'text' },
            { label: 'Phone', field: 'phone', type: 'tel' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[field as keyof typeof form]}
                onChange={(e) => update(field, e.target.value)}
                className={inputCls}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Industry</label>
            <select
              value={form.industry}
              onChange={(e) => update('industry', e.target.value)}
              className={inputCls}
            >
              <option value="">Select industry…</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => update('timezone', e.target.value)}
              className={inputCls}
            >
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={saveBusiness}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm shadow-blue-200"
            >
              {saving ? <Spinner size="sm" /> : saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Integration */}
      {tab === 'Integration' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="font-semibold text-gray-900">n8n Webhook Integration</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Paste this URL into your n8n workflow as the HTTP Request destination. Set the{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">x-webhook-secret</code> header
            to match your{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">WEBHOOK_SECRET</code> env var.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Webhook URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 truncate font-mono">
                {webhookUrl}
              </code>
              <button
                onClick={copyWebhook}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 border rounded-xl text-sm font-medium transition-all ${
                  copied
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Webhook Secret</label>
            <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 font-mono">
              Set via <code>WEBHOOK_SECRET</code> environment variable
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-sm text-blue-700">
            <p className="font-semibold mb-2 text-xs uppercase tracking-wide text-blue-500">Expected payload fields</p>
            <ul className="space-y-1 text-xs font-mono text-blue-600 columns-2">
              {[
                'retell_call_id', 'caller_name', 'caller_phone', 'call_duration_seconds',
                'call_summary', 'call_transcript', 'call_status', 'intent', 'sentiment',
                'booked', 'booking_start (optional)', 'business_id'
              ].map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Calendar */}
      {tab === 'Calendar' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <CalendarDays size={17} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Google Calendar</h2>
              <p className="text-xs text-gray-400">Connect your Google Calendar to show events on the Schedule page</p>
            </div>
          </div>

          {/* Service account status */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Service Account</p>
            {calStatusLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400"><Spinner size="sm" /> Checking…</div>
            ) : calStatus?.connected ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 size={14} className="text-green-500" />
                Configured
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={14} />
                Not configured — set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY in .env.local
              </div>
            )}
            {calStatus?.serviceAccountEmail && (
              <p className="text-xs text-gray-500 font-mono mt-1">{calStatus.serviceAccountEmail}</p>
            )}
            {calStatus?.connected && (
              <p className="text-xs text-gray-400 mt-1">
                Share your Google Calendar with the service account email above (View access is enough).
              </p>
            )}
          </div>

          {/* Calendar ID input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Google Calendar ID
            </label>
            <input
              type="text"
              placeholder="your-calendar@gmail.com or ID from calendar settings"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className={inputCls}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Found in Google Calendar → Settings → Calendar ID
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={saveCalendar}
              disabled={calendarSaving}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm shadow-blue-200"
            >
              {calendarSaving ? <Spinner size="sm" /> : calendarSaved ? <Check size={14} /> : <Save size={14} />}
              {calendarSaved ? 'Saved!' : 'Save Calendar ID'}
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === 'Notifications' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Notification Preferences</h2>
          {[
            { key: 'new_booking', label: 'New Booking', desc: 'Alert when a new booking is created by the AI agent' },
            { key: 'missed_call', label: 'Missed Call', desc: 'Alert when a call is missed' },
            { key: 'low_booking_rate', label: 'Low Booking Rate Alert', desc: 'Alert when daily booking rate drops below threshold' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4 py-1">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                className={`relative inline-flex w-10 h-[22px] rounded-full transition-colors shrink-0 mt-0.5 ${
                  notifications[key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block w-[18px] h-[18px] rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${
                    notifications[key as keyof typeof notifications] ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}

          {notifications.low_booking_rate && (
            <div className="pt-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Low Booking Rate Threshold (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={notifications.low_booking_threshold}
                onChange={(e) =>
                  setNotifications((n) => ({ ...n, low_booking_threshold: Number(e.target.value) }))
                }
                className="w-28 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
              <Save size={14} />
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Security */}
      {tab === 'Security' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="font-semibold text-gray-900">Security</h2>

          <div className="flex items-start justify-between gap-6 py-4 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Password</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Send a reset email to <span className="font-medium text-gray-600">{user?.email}</span>
              </p>
              {resetSent && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <Check size={12} /> Reset email sent — check your inbox
                </p>
              )}
            </div>
            <button
              onClick={sendPasswordReset}
              disabled={resetLoading || resetSent}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors shrink-0"
            >
              {resetLoading ? <Spinner size="sm" /> : <Mail size={14} />}
              {resetSent ? 'Email sent!' : 'Reset Password'}
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Signed in as <span className="font-medium text-gray-600">{user?.email}</span>
          </p>
        </div>
      )}
    </div>
  )
}
