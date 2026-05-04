export interface Business {
  id: string
  name: string
  owner_name: string
  phone: string | null
  timezone: string
  industry: string | null
  created_at?: string
  user_id?: string | null
  is_active?: boolean
  retell_agent_id?: string | null
  google_calendar_id?: string | null
}

export interface Profile {
  id: string
  created_at: string
  full_name: string | null
  email: string | null
  role: 'super_admin' | 'client'
  business_id: string | null
}

export interface Contact {
  id: string
  created_at: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  company: string | null
  notes: string | null
  business_id: string
}

export interface Call {
  id: string
  created_at: string
  retell_call_id: string | null
  caller_name: string | null
  caller_phone: string | null
  caller_email: string | null
  caller_address: string | null
  call_duration_seconds: number
  call_summary: string | null
  call_transcript: string | null
  call_status: 'completed' | 'missed' | 'voicemail'
  intent: 'booking' | 'inquiry' | 'reschedule' | 'cancel' | 'other' | 'book' | 'question' | 'emergency'
  sentiment: 'positive' | 'neutral' | 'negative'
  booked: boolean
  booking_id: string | null
  contact_id: string | null
  business_id: string
  contacts?: Contact
  bookings?: Booking
}

export interface Booking {
  id: string
  created_at: string
  contact_id: string | null
  contact_name: string | null
  service_type: string | null
  start_time: string
  end_time: string | null
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  source: 'ai_agent' | 'manual'
  notes: string | null
  business_id: string
  call_id: string | null
  contacts?: Contact
  calls?: Call
}

export interface WebhookPayload {
  retell_call_id: string
  caller_name: string
  caller_phone: string
  caller_email?: string
  caller_address?: string
  call_duration_seconds: number
  call_summary: string
  call_transcript: string
  call_status: 'completed' | 'missed' | 'voicemail'
  intent: 'booking' | 'inquiry' | 'reschedule' | 'cancel' | 'other' | 'book' | 'question' | 'emergency'
  sentiment: 'positive' | 'neutral' | 'negative'
  booked: boolean
  booking_start?: string
  booking_end?: string
  service_type?: string
  business_id: string
}
