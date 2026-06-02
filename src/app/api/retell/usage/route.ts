import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const period = searchParams.get('period')   // 'today'
  const since = searchParams.get('since')     // ISO date string for range queries
  const agentIdParam = searchParams.get('agent_id')

  // Resolve agent_id: prefer explicit param, else look up from business
  let agentId = agentIdParam
  if (!agentId) {
    const serverClient = createServerSupabaseClient()
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
          .select('retell_agent_id')
          .eq('id', profile.business_id)
          .single()
        agentId = business?.retell_agent_id ?? null
      }
    }
  }

  if (!agentId) {
    return NextResponse.json({ totalMinutes: 0, totalCalls: 0, agentId: null, error: 'No agent configured' })
  }

  const apiKey = process.env.RETELL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RETELL_API_KEY not configured' }, { status: 500 })
  }

  // Build filter_criteria for Retell /v2/list-calls
  const filterCriteria: Record<string, string[]> = {
    agent_id: [agentId],
  }

  // Determine time window
  let afterMs: number | null = null
  if (period === 'today') {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    afterMs = startOfDay.getTime()
  } else if (since) {
    afterMs = new Date(since).getTime()
  }

  try {
    let allCalls: Array<{ call_length?: number }> = []
    let paginationKey: string | null = null

    // Paginate through all results
    do {
      const body: Record<string, unknown> = {
        filter_criteria: filterCriteria,
        limit: 1000,
        sort_order: 'descending',
      }
      if (paginationKey) body.pagination_key = paginationKey
      if (afterMs) body.filter_criteria = { ...filterCriteria, after_start_timestamp: afterMs }

      const res = await fetch('https://api.retellai.com/v2/list-calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: `Retell API error: ${text}` }, { status: res.status })
      }

      const data = await res.json()
      const calls = Array.isArray(data) ? data : (data.calls ?? data.data ?? [])
      allCalls = allCalls.concat(calls)
      paginationKey = data.pagination_key ?? null

      // Stop if result is less than limit (no more pages)
      if (calls.length < 1000) break
    } while (paginationKey)

    const totalCalls = allCalls.length
    const totalSeconds = allCalls.reduce((sum, c) => sum + (c.call_length ?? 0), 0)
    const totalMinutes = parseFloat((totalSeconds / 60).toFixed(1))

    return NextResponse.json({ totalMinutes, totalCalls, agentId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
