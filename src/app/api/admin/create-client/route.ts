import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  // Verify caller is super_admin
  const serverClient = createServerSupabaseClient()
  const { data: { session } } = await serverClient.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: callerProfile } = await serverClient
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (callerProfile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const {
    business_name, industry, owner_full_name, email, phone, timezone,
    retell_agent_id, google_calendar_id,
  } = await req.json()

  if (!business_name || !owner_full_name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (retell_agent_id && !String(retell_agent_id).startsWith('agent_')) {
    return NextResponse.json({ error: 'Retell Agent ID must start with "agent_"' }, { status: 400 })
  }

  // Use admin client to create the auth user
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Create auth user with email invite (sends magic link / welcome email)
  const { data: newUser, error: userError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { full_name: owner_full_name },
  })

  if (userError || !newUser.user) {
    return NextResponse.json({ error: userError?.message ?? 'Failed to create user' }, { status: 500 })
  }

  const userId = newUser.user.id

  // 2. Create business record
  const { data: business, error: bizError } = await adminClient
    .from('businesses')
    .insert({
      name: business_name,
      owner_name: owner_full_name,
      phone: phone || null,
      timezone: timezone || 'America/New_York',
      industry: industry || null,
      user_id: userId,
      is_active: true,
      retell_agent_id: retell_agent_id?.trim() || null,
      google_calendar_id: google_calendar_id?.trim() || null,
    })
    .select('id')
    .single()

  if (bizError || !business) {
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: bizError?.message ?? 'Failed to create business' }, { status: 500 })
  }

  // 3. Create profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: userId,
    full_name: owner_full_name,
    email,
    role: 'client',
    business_id: business.id,
  })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId)
    await adminClient.from('businesses').delete().eq('id', business.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // 4. Send password setup invite (magic link via email)
  await adminClient.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${req.nextUrl.origin}/reset-password`,
      data: { full_name: owner_full_name, business_name },
    },
  })

  return NextResponse.json({ success: true, business_id: business.id })
}
