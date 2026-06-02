'use client'

import dynamic from 'next/dynamic'

const ScheduleClient = dynamic(() => import('@/components/schedule/ScheduleClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
    </div>
  ),
})

export default function SchedulePage() {
  return <ScheduleClient />
}
