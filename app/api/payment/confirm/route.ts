import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PACKAGES: Record<string, number> = {
  'starter':  10_000, 'basic': 50_000, 'premium': 100_000,
  'elite': 500_000, 'master': 1_000_000, 'whale': 10_000_000,
}

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount, userId, packageId } = await req.json()
    if (!paymentKey || !orderId || !amount || !userId || !packageId)
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })

    const expectedPoints = PACKAGES[packageId]
    if (!expectedPoints) return NextResponse.json({ error: '잘못된 패키지' }, { status: 400 })

    const tossSecretKey = process.env.TOSS_SECRET_KEY ?? 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R'
    const encoded = Buffer.from(tossSecretKey + ':').toString('base64')
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${encoded}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
    const tossData = await tossRes.json()
    if (!tossRes.ok) return NextResponse.json({ error: tossData.message ?? '결제 확인 실패' }, { status: 400 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Missing env' }, { status: 500 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single()
    if (!profile) return NextResponse.json({ error: '유저 조회 실패' }, { status: 400 })
    const newBalance = profile.wallet_balance + expectedPoints
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', userId)

    return NextResponse.json({ success: true, newBalance, pointsAdded: expectedPoints })
  } catch (e) {
    console.error('[payment confirm]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
