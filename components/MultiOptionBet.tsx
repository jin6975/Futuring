'use client'
import { useMemo, useState } from 'react'
import { C } from '@/lib/constants'
import type { Debate } from '@/store/usePledgeStore'

interface Props {
  debate: Debate
  walletBalance: number
  isLoggedIn: boolean
  onBet: (optionId: string, amount: number) => void
  onLoginRequired: () => void
}

const OPTION_COLORS = ['#2563EB','#7C3AED','#D97706','#059669','#DC2626','#0891B2','#BE185D','#065F46']
const PRESETS = [1000, 5000, 10000, 50000]

function ProbLineChart({ options }: { options: { id: string; name: string; pool: number; color: string }[] }) {
  const total = options.reduce((s, o) => s + o.pool, 0)
  if (total === 0) return null
  const W = 400, H = 80, PAD = { l: 8, r: 8, t: 8, b: 20 }
  const chartW = W - PAD.l - PAD.r, chartH = H - PAD.t - PAD.b
  const POINTS = 30

  const histories = useMemo(() => {
    return options.map((opt, oi) => {
      const finalPct = opt.pool / total * 100
      const pts: number[] = []
      let v = 100 / options.length
      for (let i = 0; i < POINTS; i++) {
        const t = i / (POINTS - 1)
        const noise = (Math.sin(oi * 7 + i * 3.1) * 0.5 + 0.5 - 0.5) * 15 * (1 - t)
        v = v * (1 - t * 0.3) + finalPct * t * 0.3 + noise
        v = Math.max(1, Math.min(95, v))
        pts.push(v)
      }
      pts[POINTS - 1] = finalPct
      return pts
    })
  }, [options, total])

  const toX = (i: number) => PAD.l + (i / (POINTS - 1)) * chartW
  const toY = (v: number) => PAD.t + chartH - (v / 100) * chartH

  return (
    <div style={{ background: '#0D1117', borderRadius: 12, padding: '8px 0 4px', marginBottom: 16 }}>
      <p style={{ fontSize: 11, color: '#8B949E', padding: '0 12px', marginBottom: 4, fontWeight: 600 }}>확률 변화</p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        <rect width={W} height={H} fill="#0D1117" />
        {options.map((opt, oi) => {
          const pts = histories[oi].map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
          const lastX = toX(POINTS - 1), lastY = toY(opt.pool / total * 100)
          return (
            <g key={opt.id}>
              <polyline points={pts} fill="none" stroke={opt.color} strokeWidth={1.5} opacity={0.85} />
              <circle cx={lastX} cy={lastY} r={3} fill={opt.color} />
              <text x={lastX - 2} y={lastY - 6} fontSize={8} fill={opt.color} textAnchor="end" fontWeight="700">
                {(opt.pool / total * 100).toFixed(0)}%
              </text>
            </g>
          )
        })}
        {options.slice(0, 4).map((opt, i) => (
          <g key={opt.id}>
            <rect x={PAD.l + i * 95} y={H - 14} width={8} height={4} fill={opt.color} rx={2} />
            <text x={PAD.l + i * 95 + 11} y={H - 8} fontSize={8} fill="#8B949E">
              {opt.name.length > 8 ? opt.name.slice(0, 8) + '…' : opt.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function MultiOptionBet({ debate, walletBalance, isLoggedIn, onBet, onLoginRequired }: Props) {
  const [amounts, setAmounts] = useState<Record<string, number>>({})
  const [activeOption, setActiveOption] = useState<string | null>(null)

  if (!debate.options) return null
  const total = debate.options.reduce((s, o) => s + o.pool, 0)

  const coloredOptions = debate.options.map((opt, i) => ({
    ...opt,
    color: OPTION_COLORS[i % OPTION_COLORS.length],
    pct: total > 0 ? +(opt.pool / total * 100).toFixed(1) : +(100 / debate.options!.length).toFixed(1),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <ProbLineChart options={coloredOptions} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {coloredOptions.map(opt => {
          const myAmt = amounts[opt.id] || 1000
          const isActive = activeOption === opt.id
          return (
            <div key={opt.id} style={{ background: C.white, borderRadius: 16, border: `2px solid ${isActive ? opt.color : C.grayBorder}`, overflow: 'hidden', transition: 'border-color 0.15s' }}>
              <button onClick={() => setActiveOption(isActive ? null : opt.id)}
                style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{opt.name}</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: opt.color }}>{opt.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: C.grayBorder, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${opt.pct}%`, background: opt.color, borderRadius: 99, transition: 'width 0.6s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: C.gray }}>거래량 {opt.pool.toLocaleString()}P</span>
                    <span style={{ fontSize: 11, color: isActive ? opt.color : C.gray, fontWeight: 700 }}>{isActive ? '▲ 닫기' : '베팅 →'}</span>
                  </div>
                </div>
              </button>
              {isActive && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.grayBorder}` }}>
                  <p style={{ fontSize: 12, color: C.gray, margin: '12px 0 8px', fontWeight: 600 }}>
                    베팅 금액 · 잔액 {walletBalance.toLocaleString()}P
                  </p>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {PRESETS.filter(p => p <= walletBalance || p === 1000).map(p => (
                      <button key={p} onClick={() => setAmounts(prev => ({ ...prev, [opt.id]: p }))}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: myAmt === p ? opt.color : C.grayLight, color: myAmt === p ? '#fff' : C.gray }}>
                        {p >= 1000 ? `${p / 1000}K` : p}
                      </button>
                    ))}
                  </div>
                  <input type="number" value={myAmt} onChange={e => setAmounts(prev => ({ ...prev, [opt.id]: Number(e.target.value) || 0 }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 14, color: C.navy, background: C.grayLight, marginBottom: 10, boxSizing: 'border-box' as const, outline: 'none' }} />
                  {myAmt > 0 && myAmt <= walletBalance && (
                    <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '8px 12px', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: C.gray }}>예상 수령액</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.green }}>
                        {opt.pct > 0 ? Math.round(myAmt * 100 / opt.pct).toLocaleString() : '∞'}P
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (!isLoggedIn) { onLoginRequired(); return }
                      if (myAmt > 0 && myAmt <= walletBalance) onBet(opt.id, myAmt)
                    }}
                    disabled={isLoggedIn && (myAmt <= 0 || myAmt > walletBalance)}
                    style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: myAmt > 0 && myAmt <= walletBalance ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 800, background: myAmt > 0 && myAmt <= walletBalance ? opt.color : C.grayLight, color: myAmt > 0 && myAmt <= walletBalance ? '#fff' : C.gray, boxShadow: myAmt > 0 && myAmt <= walletBalance ? `0 4px 14px ${opt.color}44` : 'none' }}>
                    {!isLoggedIn ? '로그인 후 베팅' : myAmt > walletBalance ? '잔액 부족' : `${opt.name}에 ${myAmt.toLocaleString()}P 베팅`}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
