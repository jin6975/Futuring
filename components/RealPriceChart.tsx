'use client'
import { useEffect, useState, useRef, useCallback } from 'react'

interface Candle {
  time: number; open: number; high: number; low: number; close: number; volume: number
}

interface PriceData {
  ticker: string; currency: string
  regularMarketPrice: number | null; previousClose: number | null
  candles: Candle[]
}

const RANGES = [
  { label: '1일', range: '1d', interval: '5m' },
  { label: '1주', range: '5d', interval: '1h' },
  { label: '1달', range: '1mo', interval: '1d' },
  { label: '3달', range: '3mo', interval: '1d' },
  { label: '1년', range: '1y', interval: '1wk' },
]

function fmtPrice(price: number, currency: string) {
  if (currency === 'KRW') return `₩${price.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function RealPriceChart({ ticker, label }: { ticker: string; label?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [rangeIdx, setRangeIdx] = useState(2)
  const [data, setData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [mouseX, setMouseX] = useState(0)

  const { range, interval } = RANGES[rangeIdx]

  useEffect(() => {
    setLoading(true); setError(false); setHoverIdx(null)
    fetch(`/api/price?ticker=${encodeURIComponent(ticker)}&range=${range}&interval=${interval}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [ticker, range, interval])

  // SVG 캔들 차트
  const W = 600, H = 200, VOLH = 36
  const PAD = { l: 8, r: 56, t: 12, b: 28 }
  const chartH = H - PAD.t - PAD.b - VOLH - 6
  const chartW = W - PAD.l - PAD.r

  const candles = data?.candles ?? []
  const allP = candles.flatMap(c => [c.high, c.low]).filter(Boolean)
  const minP = allP.length ? Math.min(...allP) * 0.999 : 0
  const maxP = allP.length ? Math.max(...allP) * 1.001 : 1
  const maxVol = Math.max(...candles.map(c => c.volume || 0), 1)

  const toY   = useCallback((v: number) => PAD.t + chartH - ((v - minP) / (maxP - minP)) * chartH, [chartH, minP, maxP])
  const toVY  = useCallback((v: number) => H - PAD.b - (v / maxVol) * VOLH, [H, PAD.b, maxVol])

  const cw = candles.length > 0 ? chartW / candles.length : 4
  const bw = Math.max(1.5, cw * 0.6)

  const price = data?.regularMarketPrice
  const prev  = data?.previousClose
  const changePct = price && prev ? ((price - prev) / prev * 100) : null
  const isUp = changePct !== null ? changePct >= 0 : true
  const hovered = hoverIdx !== null ? candles[hoverIdx] : null

  const grids = [0.25, 0.5, 0.75].map(r => minP + (maxP - minP) * r)

  const onMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width * W
    setMouseX(x)
    const idx = Math.floor((x - PAD.l) / cw)
    setHoverIdx(idx >= 0 && idx < candles.length ? idx : null)
  }, [cw, candles.length])

  return (
    <div style={{ background: '#0D1117', borderRadius: 14, overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#E6EDF3' }}>{label ?? ticker}</span>
          {price && data && <span style={{ fontSize: 15, fontWeight: 900, color: '#E6EDF3' }}>{fmtPrice(price, data.currency)}</span>}
          {changePct !== null && (
            <span style={{ fontSize: 11, fontWeight: 700, color: isUp ? '#26a69a' : '#ef5350' }}>
              {isUp ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
            </span>
          )}
          {hovered && (
            <span style={{ fontSize: 11, color: hovered.close >= hovered.open ? '#26a69a' : '#ef5350', fontWeight: 600 }}>
              O:{hovered.open?.toFixed(2)} H:{hovered.high?.toFixed(2)} L:{hovered.low?.toFixed(2)} C:{hovered.close?.toFixed(2)}
            </span>
          )}
          {loading && <span style={{ fontSize: 11, color: '#8B949E' }}>로딩 중...</span>}
          {error && <span style={{ fontSize: 11, color: '#ef5350' }}>데이터 없음</span>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map((r, i) => (
            <button key={r.label} onClick={() => setRangeIdx(i)}
              style={{ padding: '3px 9px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: rangeIdx === i ? '#1D4ED8' : '#21262D', color: rangeIdx === i ? '#fff' : '#8B949E' }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG 캔들 차트 */}
      {loading ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B949E', fontSize: 13 }}>실시간 가격 데이터 로딩 중...</div>
      ) : error ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B949E', fontSize: 13 }}>가격 데이터를 불러올 수 없어요</div>
      ) : (
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
          style={{ width: '100%', height: H, display: 'block', cursor: 'crosshair' }}
          onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)}>
          <rect width={W} height={H} fill="#0D1117" />
          {grids.map((v, i) => (
            <g key={i}>
              <line x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)} stroke="#21262D" strokeWidth={1} />
              <text x={W - PAD.r + 4} y={toY(v) + 4} fontSize={8} fill="#8B949E">
                {v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toFixed(data?.currency === 'KRW' ? 0 : 2)}
              </text>
            </g>
          ))}
          {candles.map((c, i) => {
            const x = PAD.l + i * cw + cw / 2
            const bull = c.close >= c.open
            const color = bull ? '#26a69a' : '#ef5350'
            const bTop = toY(Math.max(c.open, c.close))
            const bH = Math.max(1.5, Math.abs(toY(c.open) - toY(c.close)))
            return (
              <g key={i} opacity={hoverIdx !== null && hoverIdx !== i ? 0.5 : 1}>
                <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={color} strokeWidth={1} />
                <rect x={x - bw / 2} y={bTop} width={bw} height={bH} fill={color} rx={1} />
                <rect x={PAD.l + i * cw} y={toVY(c.volume)} width={Math.max(1, cw - 1)} height={H - PAD.b - toVY(c.volume)} fill={color} opacity={0.35} rx={1} />
              </g>
            )
          })}
          {/* 현재가 점선 */}
          {price && (
            <>
              <line x1={PAD.l} y1={toY(price)} x2={W - PAD.r} y2={toY(price)} stroke="#1D4ED8" strokeWidth={1} strokeDasharray="4 3" opacity={0.8} />
              <rect x={W - PAD.r} y={toY(price) - 8} width={PAD.r - 2} height={16} fill="#1D4ED8" rx={3} />
              <text x={W - PAD.r + 3} y={toY(price) + 4} fontSize={8} fill="#fff" fontWeight="700">
                {price >= 1000 ? `${(price/1000).toFixed(1)}K` : price.toFixed(2)}
              </text>
            </>
          )}
          {/* 십자선 */}
          {hoverIdx !== null && (
            <line x1={mouseX} y1={PAD.t} x2={mouseX} y2={H - PAD.b} stroke="#8B949E" strokeWidth={0.5} strokeDasharray="3 3" />
          )}
        </svg>
      )}
    </div>
  )
}
