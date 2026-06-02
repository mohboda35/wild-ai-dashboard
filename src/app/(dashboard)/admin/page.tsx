'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'
import AdminBusinessesTab from '@/components/admin/AdminBusinessesTab'
import AdminOverviewTab from '@/components/admin/AdminOverviewTab'

const TABS = ['Overview', 'Businesses'] as const
type Tab = typeof TABS[number]

export default function AdminPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Overview')

  useEffect(() => {
    if (!loading && profile?.role !== 'super_admin') {
      router.replace('/')
    }
  }, [loading, profile, router])

  if (loading || profile?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Super Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all businesses and client accounts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <AdminOverviewTab />}
      {tab === 'Businesses' && <AdminBusinessesTab />}
    </div>
  )
}
