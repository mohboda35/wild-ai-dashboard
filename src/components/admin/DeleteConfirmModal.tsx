'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/lib/types'
import Spinner from '@/components/ui/Spinner'

interface Props {
  business: Business
  onClose: () => void
  onDeleted: () => void
}

export default function DeleteConfirmModal({ business, onClose, onDeleted }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    const { error: err } = await supabase.from('businesses').delete().eq('id', business.id)
    setLoading(false)
    if (err) { setError(err.message); return }
    onDeleted()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Delete Business</h2>
              <p className="text-xs text-gray-500">This action cannot be undone</p>
            </div>
            <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={16} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-5">
            Are you sure you want to delete <strong>{business.name}</strong>? All associated calls,
            contacts, and bookings will also be permanently deleted.
          </p>

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {loading && <Spinner size="sm" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
