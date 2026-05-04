'use client'

import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, profileError, user } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (profileError) {
    const isNoProfile = profileError === 'no_profile'
    const isNoRole = profileError === 'no_role'

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isNoProfile ? 'Profile not set up' : isNoRole ? 'Account not configured' : 'Profile error'}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {isNoProfile
              ? 'Your account was created but no profile row exists yet. Ask your admin to complete setup, or run the auth-migration.sql and insert a profile row for your user ID.'
              : isNoRole
              ? 'Your profile exists but has no role assigned. Ask your admin to set your role in the profiles table.'
              : `Unexpected error: ${profileError}`}
          </p>
          {user && (
            <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-2">
              User ID: {user.id}
            </p>
          )}
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.replace('/login')
            }}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
