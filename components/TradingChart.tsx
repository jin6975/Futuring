'use client'
import { useMemo, useRef, useState, useCallback } from 'react'

interface Candle { open:number; close:number; high:number; low:number; vol:number; ts:number }

function buildCandles(seed: number, current: number): Candle[] {
  const candles: Candle[] = []
  let price = 50
  const now = Date.now()
  for (let i = 0; i < 60; i++) {
    const rng = (Math.sin(seed * 9301 + i * 49297 + 233995) + 1) / 2
    const open = price
    const change = (rng - 0.47) * 5
    const close = Math.max(3, Math.min(97, open + change))
    const wick = rng * 3
    candles.push({ open, close, high:Math.min(99,Math.max(open,close)+wick), low:Math.max(1,Math.min(open,close)-wick), vol:Math.floor(rng*8000+1000), ts:now-(60-i)*3600000 })
    price = close
  }
  candles[candles.length-1].close = current
  return candles
}

function calcMA(candles: Candle[], p: number): (number|null)[] {
  return candles.map((_,i) => i<p-1?null:candles.slice(i-p+1,i+1).reduce((s,c)=>s+c.close,0)/p)
}

// SVG viewBox 고정 좌표계 사용 — width/height는 CSS로만 제어
function ChartSVG({ candles, hoverIdx, onHover, compactH }: {
  candles: Candle[]
  hoverIdx: number|null
  onHover: (i: number|null, x: number, y: number) => void
  compactH?: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const ma7  = useMemo(() => calcMA(candles, 7),  [candles])
  const ma20 = useMemo(() => calcMA(candles, 20), [candles])

  // viewBox 고정 좌표계
  const VW = 600, VH = compactH ?? 220
  const VOLH = 40, PAD = { l:40, r:50, t:16, b:28 }
  const chartH = VH - PAD.t - PAD.b - VOLH - 8
  const chartW = VW - PAD.l - PAD.r

  const allP = candles.flatMap(c=>[c.high,c.low])
  const minP = Math.floor(Math.min(...allP)-1), maxP = Math.ceil(Math.max(...allP)+1)
  const maxVol = Math.max(...candles.map(c=>c.vol))
  const toY  = (v:number) => PAD.t + chartH - ((v-minP)/(maxP-minP))*chartH
  const toVY = (v:number) => VH-PAD.b-(v/maxVol)*VOLH
  const cw = chartW/candles.length, bw = Math.max(2,cw*0.55)

  const maPath = (vals:(number|null)[], color:string) => {
    let d = ''; let prev = false
    vals.forEach((v,i) => {
      if(v===null){prev=false;return}
      const x=PAD.l+i*cw+cw/2, y=toY(v)
      d += prev?` L${x},${y}`:`M${x},${y}`; prev=true
    })
    return d ? <path d={d} fill="none" stroke={color} strokeWidth={1.5} opacity={0.9}/> : null
  }

  const onMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    // 화면 좌표 → viewBox 좌표계로 변환
    const x = (e.clientX-rect.left)/rect.width*VW
    const y = (e.clientY-rect.top)/rect.height*VH
    const idx = Math.floor((x-PAD.l)/cw)
    onHover(idx>=0&&idx<candles.length?idx:null, x, y)
  }, [cw, candles.length, onHover])

  const currentPct = candles[candles.length-1]?.close ?? 50
  const grids = [25,50,75].filter(v=>v>minP&&v<maxP)

  return (
    // viewBox로 내부 좌표 고정, width:'100%' + height 명시로 실제 크기 결정
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="none"
      style={{ width:'100%', height: VH, display:'block' }}
      onMouseMove={onMove}
      onMouseLeave={()=>onHover(null,0,0)}
    >
      <rect width={VW} height={VH} fill="#0D1117"/>
      {grids.map(v=>(
        <g key={v}>
          <line x1={PAD.l} y1={toY(v)} x2={VW-PAD.r} y2={toY(v)} stroke="#21262D" strokeWidth={1}/>
          <text x={VW-PAD.r+4} y={toY(v)+4} fontSize={9} fill="#8B949E">{v}%</text>
        </g>
      ))}
      {candles.map((c,i) => {
        const x=PAD.l+i*cw+cw/2, bull=c.close>=c.open, color=bull?'#26a69a':'#ef5350'
        const bTop=toY(Math.max(c.open,c.close)), bH=Math.max(1.5,Math.abs(toY(c.open)-toY(c.close)))
        const isHov = hoverIdx===i
        return (
          <g key={i} opacity={hoverIdx!==null&&!isHov?0.5:1}>
            <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={color} strokeWidth={isHov?1.5:1}/>
            <rect x={x-bw/2} y={bTop} width={bw} height={bH} fill={color} rx={1} stroke={isHov?'#fff':'none'} strokeWidth={0.5} opacity={0.9}/>
            <rect x={PAD.l+i*cw+1} y={toVY(c.vol)} width={Math.max(1,cw-2)} height={VH-PAD.b-toVY(c.vol)} fill={color} opacity={0.35} rx={1}/>
          </g>
        )
      })}
      {maPath(ma7, '#F0B90B')}
      {maPath(ma20, '#2196F3')}
      <line x1={PAD.l} y1={toY(currentPct)} x2={VW-PAD.r} y2={toY(currentPct)} stroke="#1D4ED8" strokeWidth={1} strokeDasharray="4 3" opacity={0.8}/>
      <rect x={VW-PAD.r} y={toY(currentPct)-8} width={PAD.r-2} height={16} fill="#1D4ED8" rx={3}/>
      <text x={VW-PAD.r+3} y={toY(currentPct)+4} fontSize={9} fill="#fff" fontWeight="700">{currentPct.toFixed(1)}%</text>
      {hoverIdx!==null && (() => {
        const c=candles[hoverIdx], x=PAD.l+hoverIdx*cw+cw/2
        return <>
          <line x1={x} y1={PAD.t} x2={x} y2={VH-PAD.b} stroke="#8B949E" strokeWidth={0.5} strokeDasharray="3 3"/>
          <rect x={Math.min(x-24,VW-PAD.r-50)} y={VH-PAD.b+2} width={48} height={14} fill="#21262D" rx={3}/>
          <text x={Math.min(x,VW-PAD.r-26)} y={VH-PAD.b+12} fontSize={8} fill="#E6EDF3" textAnchor="middle">
            {new Date(c.ts).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'})}
          </text>
        </>
      })()}
      <line x1={PAD.l} y1={VH-PAD.b-VOLH-2} x2={VW-PAD.r} y2={VH-PAD.b-VOLH-2} stroke="#21262D" strokeWidth={1}/>
      <text x={PAD.l-2} y={VH-PAD.b-VOLH+8} fontSize={8} fill="#8B949E" textAnchor="end">VOL</text>
    </svg>
  )
}

export default function TradingChart({ currentPct, seed=1, compact=false }: { currentPct:number; seed?:number; compact?:boolean }) {
  const [hoverIdx, setHoverIdx] = useState<number|null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const candles = useMemo(() => buildCandles(seed, currentPct), [seed, currentPct])
  const hovered = hoverIdx!==null ? candles[hoverIdx] : null

  const onHover = useCallback((i:number|null) => { setHoverIdx(i) }, [])

  const chartContent = (isFull: boolean) => (
    <div style={{ background:'#0D1117', borderRadius:isFull?0:16, overflow:'hidden', width:'100%' }}>
      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px 6px' }}>
        <div style={{ display:'flex', gap:12, alignItems:'center', fontSize:11 }}>
          <span style={{ color:'#8B949E' }}>YES 확률</span>
          <span style={{ color:'#F0B90B', display:'flex', alignItems:'center', gap:3 }}><span style={{ width:16,height:2,background:'#F0B90B',display:'inline-block' }}/>MA7</span>
          <span style={{ color:'#2196F3', display:'flex', alignItems:'center', gap:3 }}><span style={{ width:16,height:2,background:'#2196F3',display:'inline-block' }}/>MA20</span>
          {hovered && <span style={{ color:hovered.close>=hovered.open?'#26a69a':'#ef5350', fontWeight:700 }}>
            O:{hovered.open.toFixed(1)} H:{hovered.high.toFixed(1)} L:{hovered.low.toFixed(1)} C:{hovered.close.toFixed(1)}%
          </span>}
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#26a69a' }}>YES {currentPct}%</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#ef5350' }}>NO {100-currentPct}%</span>
          <button onClick={()=>setFullscreen(!isFull)} style={{ background:'#21262D', border:'none', cursor:'pointer', borderRadius:6, padding:'4px 8px', color:'#8B949E', fontSize:11 }}>
            {isFull?'⊠ 닫기':'⛶ 전체화면'}
          </button>
        </div>
      </div>
      {/* SVG — height를 prop으로 직접 전달해 CSS height:'100%' 의존 제거 */}
      <ChartSVG
        candles={candles}
        hoverIdx={hoverIdx}
        onHover={onHover}
        compactH={isFull ? 560 : compact ? 160 : 220}
      />
    </div>
  )

  return (
    <>
      {chartContent(false)}
      {fullscreen && (
        <div style={{ position:'fixed', inset:0, zIndex:500, background:'#0D1117' }}>
          {chartContent(true)}
        </div>
      )}
    </>
  )
}
