'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/lib/types'
import Spinner from '@/components/ui/Spinner'
import { Plus, Trash2, ToggleLeft, ToggleRight, Zap, CalendarDays } from 'lucide-react'
import AddClientModal from '@/components/admin/AddClientModal'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'

interface BusinessRow extends Business {
  profile_email: string | null
}

export default function AdminBusinessesTab() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BusinessRow | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })

    if (!biz) { setLoading(false); return }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('business_id, email')

    const emailByBiz: Record<string, string> = {}
    profiles?.forEach((p) => { if (p.business_id) emailByBiz[p.business_id] = p.email ?? '' })

    setBusinesses(biz.map((b) => ({ ...b, profile_email: emailByBiz[b.id] ?? null })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleActive(b: BusinessRow) {
    setTogglingId(b.id)
    await supabase.from('businesses').update({ is_active: !b.is_active }).eq('id', b.id)
    await load()
    setTogglingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add New Client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No businesses yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Business</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Retell</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Calendar</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.industry ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{b.owner_name}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{b.profile_email ?? '—'}</td>
                  <td className="px-5 py-3">
                    {b.retell_agent_id ? (
                      <div className="flex items-center gap-1.5 text-xs text-green-700">
                        <Zap size={11} className="text-green-500" />
                        <span className="font-mono truncate max-w-[90px]" title={b.retell_agent_id}>
                          {b.retell_agent_id.slice(0, 10)}…
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 italic">Not set</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {b.google_calendar_id ? (
                      <div className="flex items-center gap-1.5 text-xs text-purple-700">
                        <CalendarDays size={11} className="text-purple-500" />
                        <span className="truncate max-w-[90px]" title={b.google_calendar_id}>
                          {b.google_calendar_id.length > 12
                            ? b.google_calendar_id.slice(0, 12) + '…'
                            : b.google_calendar_id}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 italic">Not set</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.is_active !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {b.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleActive(b)}
                        disabled={togglingId === b.id}
                        title={b.is_active !== false ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                      >
                        {togglingId === b.id ? (
                          <Spinner size="sm" />
                        ) : b.is_active !== false ? (
                          <ToggleRight size={18} className="text-green-600" />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(b)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete business"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddClientModal onClose={() => { setShowAdd(false); load() }} />}
      {deleteTarget && (
        <DeleteConfirmModal
          business={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); load() }}
        />
      )}
    </div>
  )
}
