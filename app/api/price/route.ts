import { NextRequest, NextResponse } from 'next/server'

// Yahoo Finance v8 비공식 API 프록시
// CORS 우회를 위해 서버 라우트에서 fetch
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ticker = searchParams.get('ticker') ?? 'BTC-USD'
  const range  = searchParams.get('range')  ?? '1mo'   // 1d, 5d, 1mo, 3mo, 6mo, 1y
  const interval = searchParams.get('interval') ?? '1d' // 1m, 5m, 15m, 1h, 1d

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}&includePrePost=false`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // 60초 캐시
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'upstream error', status: res.status }, { status: 502 })
    }

    const data = await res.json()
    const result = data?.chart?.result?.[0]

    if (!result) {
      return NextResponse.json({ error: 'no data' }, { status: 404 })
    }

    const timestamps: number[] = result.timestamp ?? []
    const quote = result.indicators?.quote?.[0] ?? {}
    const opens:  (number|null)[] = quote.open  ?? []
    const highs:  (number|null)[] = quote.high  ?? []
    const lows:   (number|null)[] = quote.low   ?? []
    const closes: (number|null)[] = quote.close ?? []
    const volumes:(number|null)[] = quote.volume ?? []
    const meta = result.meta ?? {}

    // candle 배열로 정규화
    const candles = timestamps
      .map((ts, i) => ({
        time: ts,
        open:  opens[i]  ?? null,
        high:  highs[i]  ?? null,
        low:   lows[i]   ?? null,
        close: closes[i] ?? null,
        volume: volumes[i] ?? 0,
      }))
      .filter(c => c.open !== null && c.close !== null)

    return NextResponse.json({
      ticker,
      currency: meta.currency ?? 'USD',
      regularMarketPrice: meta.regularMarketPrice ?? null,
      previousClose: meta.previousClose ?? meta.chartPreviousClose ?? null,
      candles,
    })
  } catch (e) {
    console.error('[price api]', e)
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
