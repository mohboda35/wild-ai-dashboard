import { Phone } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0f172a]">
            <Phone size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-[#0f172a] tracking-tight">Wild AI</span>
        </div>
        {children}
      </div>
    </div>
  )
}
