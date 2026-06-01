import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
)

webpush.setVapidDetails(
  'mailto:admin@futuring.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, link } = await req.json()
    if (!userId || !title) return NextResponse.json({ error: '파라미터 누락' }, { status: 400 })
    const { data: sub } = await supabase.from('push_subscriptions').select('subscription').eq('user_id', userId).single()
    if (!sub) return NextResponse.json({ error: '구독 정보 없음' }, { status: 404 })
    const subscription = JSON.parse(sub.subscription)
    await webpush.sendNotification(subscription, JSON.stringify({ title, body, link: link ?? '/' }))
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[push send]', e)
    return NextResponse.json({ error: '발송 실패' }, { status: 500 })
  }
}
