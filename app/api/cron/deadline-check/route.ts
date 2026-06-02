import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Missing env' }, { status: 500 })

  const { createClient } = await import('@supabase/supabase-js')
  const { createNotification } = await import('@/lib/notifications')
  const supabase = createClient(supabaseUrl, supabaseKey)

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 3600 * 1000)
  const in25h = new Date(now.getTime() + 25 * 3600 * 1000)

  const { data: markets } = await supabase
    .from('markets').select('id, topic')
    .eq('status', 'live')
    .gte('resolves_at', in24h.toISOString())
    .lte('resolves_at', in25h.toISOString())

  if (!markets || markets.length === 0) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const market of markets) {
    const { data: bets } = await supabase
      .from('bets').select('user_id')
      .eq('market_id', market.id).eq('action', 'PLEDGE')
    if (!bets) continue
    const userIds = [...new Set(bets.map((b: { user_id: string }) => b.user_id))]
    for (const userId of userIds) {
      await createNotification(userId, 'deadline', '⏰ 마감 24시간 전',
        `"${market.topic}" 마감이 24시간 남았어요!`, `/market/${market.id}`)
      sent++
    }
  }
  return NextResponse.json({ sent, markets: markets.length })
}
