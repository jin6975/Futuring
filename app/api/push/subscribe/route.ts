import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json()
    if (!userId || !subscription) return NextResponse.json({ error: '파라미터 누락' }, { status: 400 })
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')
    await supabase.from('push_subscriptions').upsert({ user_id: userId, endpoint: subscription.endpoint, subscription: JSON.stringify(subscription), updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: '서버 오류' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: '파라미터 누락' }, { status: 400 })
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')
    await supabase.from('push_subscriptions').delete().eq('user_id', userId)
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: '서버 오류' }, { status: 500 }) }
}
