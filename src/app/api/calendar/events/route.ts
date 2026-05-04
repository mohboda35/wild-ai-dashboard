import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const check = searchParams.get('check') === 'true'
  const businessIdParam = searchParams.get('business_id')

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  if (check) {
    return NextResponse.json({
      configured: !!(serviceAccountEmail && serviceAccountKey),
      serviceAccountEmail: serviceAccountEmail ?? null,
    })
  }

  if (!serviceAccountEmail || !serviceAccountKey) {
    return NextResponse.json({ error: 'Google service account not configured' }, { status: 500 })
  }

  const serverClient = createServerSupabaseClient()

  // Resolve business_id: prefer explicit param, else from session
  let calendarId: string | null = null

  if (businessIdParam) {
    const { data: business } = await serverClient
      .from('businesses')
      .select('google_calendar_id')
      .eq('id', businessIdParam)
      .single()
    calendarId = business?.google_calendar_id ?? null
  } else {
    const { data: { session } } = await serverClient.auth.getSession()
    if (session) {
      const { data: profile } = await serverClient
        .from('profiles')
        .select('business_id')
        .eq('id', session.user.id)
        .single()

      if (profile?.business_id) {
        const { data: business } = await serverClient
          .from('businesses')
          .select('google_calendar_id')
          .eq('id', profile.business_id)
          .single()
        calendarId = business?.google_calendar_id ?? null
      }
    }
  }

  if (!calendarId) {
    return NextResponse.json({ events: [], connected: false, serviceAccountEmail })
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: serviceAccountKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    })

    const calendar = google.calendar({ version: 'v3', auth })
    const now = new Date()
    const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString()

    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = (response.data.items ?? []).map((e) => ({
      id: e.id ?? '',
      title: e.summary ?? 'Event',
      start: e.start?.dateTime ?? e.start?.date ?? '',
      end: e.end?.dateTime ?? e.end?.date ?? '',
      source: 'google' as const,
    }))

    return NextResponse.json({ events, connected: true, serviceAccountEmail })
  } catch (err) {
    return NextResponse.json({ error: String(err), events: [], connected: false, serviceAccountEmail })
  }
}
