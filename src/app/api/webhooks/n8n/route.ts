import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import type { WebhookPayload } from '@/lib/types'

export async function POST(req: NextRequest) {
  // Validate webhook secret
  const secret = req.headers.get('x-webhook-secret')
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Match or create contact by phone
  let contactId: string | null = null

  if (payload.caller_phone) {
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('phone', payload.caller_phone)
      .eq('business_id', payload.business_id)
      .single()

    if (existingContact) {
      contactId = existingContact.id
    } else {
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          name: payload.caller_name || 'Unknown Caller',
          phone: payload.caller_phone,
          email: payload.caller_email || null,
          address: payload.caller_address || null,
          business_id: payload.business_id,
        })
        .select('id')
        .single()

      if (newContact) contactId = newContact.id
    }
  }

  // 2. Upsert call record
  const callData = {
    retell_call_id: payload.retell_call_id,
    caller_name: payload.caller_name || null,
    caller_phone: payload.caller_phone || null,
    caller_email: payload.caller_email || null,
    caller_address: payload.caller_address || null,
    call_duration_seconds: payload.call_duration_seconds ?? 0,
    call_summary: payload.call_summary || null,
    call_transcript: payload.call_transcript || null,
    call_status: payload.call_status,
    intent: payload.intent,
    sentiment: payload.sentiment,
    booked: payload.booked ?? false,
    contact_id: contactId,
    business_id: payload.business_id,
  }

  const { data: upsertedCall, error: callError } = await supabase
    .from('calls')
    .upsert(callData, { onConflict: 'retell_call_id' })
    .select('id')
    .single()

  if (callError) {
    console.error('Call upsert error:', callError)
    return NextResponse.json({ error: 'Failed to save call' }, { status: 500 })
  }

  const callId = upsertedCall?.id

  // 3. Create booking if booked=true and booking_start provided
  if (payload.booked && payload.booking_start && callId) {
    const { data: booking } = await supabase
      .from('bookings')
      .insert({
        contact_id: contactId,
        contact_name: payload.caller_name || 'Unknown',
        service_type: payload.service_type || null,
        start_time: payload.booking_start,
        end_time: payload.booking_end || null,
        status: 'scheduled',
        source: 'ai_agent',
        business_id: payload.business_id,
        call_id: callId,
      })
      .select('id')
      .single()

    // Link booking back to call
    if (booking) {
      await supabase
        .from('calls')
        .update({ booking_id: booking.id })
        .eq('id', callId)
    }
  }

  return NextResponse.json({ success: true, call_id: callId })
}
