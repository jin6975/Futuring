import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, link } = await req.json()
    if (!userId || !title) return NextResponse.json({ error: '파라미터 누락' }, { status: 400 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY
    if (!supabaseUrl || !supabaseKey || !vapidPublic || !vapidPrivate)
      return NextResponse.json({ error: 'Missing env' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: sub } = await supabase.from('push_subscriptions').select('subscription').eq('user_id', userId).single()
    if (!sub) return NextResponse.json({ error: '구독 정보 없음' }, { status: 404 })

    const webpush = (await import('web-push')).default
    webpush.setVapidDetails('mailto:admin@futuring.app', vapidPublic, vapidPrivate)
    await webpush.sendNotification(JSON.parse(sub.subscription), JSON.stringify({ title, body, link: link ?? '/' }))
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[push send]', e)
    return NextResponse.json({ error: '발송 실패' }, { status: 500 })
  }
}
