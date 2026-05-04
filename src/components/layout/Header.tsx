'use client'

import { Bell, ChevronDown, LogOut, Shield, Settings } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Business } from '@/lib/types'

export default function Header() {
  const { profile } = useAuth()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profile?.business_id) return
    supabase
      .from('businesses')
      .select('*')
      .eq('id', profile.business_id)
      .single()
      .then(({ data }) => { if (data) setBusiness(data) })
  }, [profile?.business_id])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const displayName = profile?.full_name ?? profile?.email ?? 'User'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const isSuperAdmin = profile?.role === 'super_admin'

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 shadow-[0_1px_0_0_#f1f5f9]">
      <div className="flex flex-col justify-center">
        {business ? (
          <>
            <span className="text-sm font-semibold text-gray-900 leading-tight">{business.name}</span>
            <span className="text-[11px] text-gray-400 leading-tight">{business.industry}</span>
          </>
        ) : isSuperAdmin ? (
          <span className="text-sm font-semibold text-gray-900">Wild AI — Admin</span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 cursor-pointer select-none rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {initials}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium text-gray-900 leading-tight max-w-32 truncate">
                {displayName}
              </span>
              <span className="text-[11px] text-gray-400 leading-tight">
                {isSuperAdmin ? 'Super Admin' : 'Owner'}
              </span>
            </div>
            <ChevronDown size={13} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg shadow-gray-200/80 border border-gray-100 py-1.5 z-50">
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Shield size={14} className="text-blue-600 shrink-0" />
                  Admin Panel
                </Link>
              )}
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings size={14} className="text-gray-400 shrink-0" />
                Settings
              </Link>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} className="shrink-0" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
