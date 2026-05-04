'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  PhoneCall,
  Calendar,
  BarChart2,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/calls', label: 'Calls', icon: PhoneCall },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/billing', label: 'Usage & Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`relative flex flex-col bg-[#0a0f1e] text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } min-h-screen shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center px-4 py-4 border-b border-white/[0.06] h-[60px]">
        {collapsed ? (
          <div className="w-8 h-8 relative overflow-hidden shrink-0">
            <Image src="/logo.png" alt="Wild AI" fill className="object-contain object-left" />
          </div>
        ) : (
          <Image
            src="/logo.png"
            alt="Wild AI"
            width={120}
            height={36}
            className="h-9 w-auto object-contain object-left"
          />
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[18px] z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[#1e293b] border border-white/10 text-slate-400 hover:text-white transition-colors shadow-sm"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
              }`}
              title={collapsed ? label : undefined}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-blue-500" />
              )}
              <Icon size={17} className="shrink-0" />
              {!collapsed && (
                <span className="text-[13px] font-medium whitespace-nowrap">{label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom badge */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        {collapsed ? (
          <div className="flex justify-center">
            <Zap size={14} className="text-blue-400/70" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Zap size={11} className="text-blue-400/70" />
            <span>Powered by Wild AI</span>
          </div>
        )}
      </div>
    </aside>
  )
}
