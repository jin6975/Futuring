'use client'
import Link from 'next/link'
import { useState } from 'react'
import { C } from '@/lib/constants'
import type { Debate, Side } from '@/store/usePledgeStore'

function fmtPool(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M P`
  return `${(n / 1_000).toFixed(0)}K P`
}

export default function FuturingMarketCard({ debate: m, onBet }: {
  debate: Debate
  onBet?: (d: Debate, side: Side) => void
}) {
  const [hov, setHov] = useState(false)
  const pctA = Math.round(m.metrics.impliedProbA * 100)
  const pctB = 100 - pctA
  const daysLeft = Math.max(0, Math.ceil((m.resolvesAt - Date.now()) / 86400000))

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: C.white, borderRadius: 20, padding: 20,
      border: `1.5px solid ${hov ? '#BFDBFE' : C.grayBorder}`,
      boxShadow: hov ? '0 8px 32px rgba(29,78,216,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
      transform: hov ? 'translateY(-2px)' : 'none',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.blueMid, background: C.bluePale, borderRadius: 6, padding: '3px 8px' }}>{m.category}</span>
        {m.metrics.totalPool > 1_000_000 && <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FFFBEB', borderRadius: 6, padding: '3px 8px' }}>🔥 인기</span>}
        {m.status === 'pending_resolution' && <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', background: '#FFFBEB', borderRadius: 6, padding: '3px 8px', border: '1px solid #FDE68A' }}>⏳ 정산대기</span>}
        {m.owner && (
          <a href={`/user/${m.owner}`} onClick={e=>e.stopPropagation()} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:16, height:16, borderRadius:'50%', background:'linear-gradient(135deg,#3B82F6,#1D4ED8)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:8, fontWeight:800, flexShrink:0 }}>{m.owner[0].toUpperCase()}</div>
            <span style={{ fontSize:10, color:C.gray, fontWeight:600 }}>@{m.owner}</span>
          </a>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: C.gray }}>⏰ {daysLeft}일 후</span>
      </div>
      <Link href={`/market/${m.id}`} style={{ textDecoration: 'none' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, lineHeight: 1.5, marginBottom: 14, letterSpacing: '-0.01em', cursor: 'pointer' }}>{m.topic}</p>
      </Link>
      {m.type === 'binary' ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ height: 7, borderRadius: 99, overflow: 'hidden', background: `linear-gradient(to right, ${C.blueMid} ${pctA}%, #FCA5A5 ${pctA}%)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.blueMid }}>{m.sideA_name} {pctA}%</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>{m.sideB_name} {pctB}%</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${C.grayBorder}`, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: C.gray }}>💰 {fmtPool(m.metrics.totalPool)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => m.status==='live' && onBet?.(m, 'A')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: m.status==='pending_resolution'?C.grayLight:C.bluePale, border: 'none', cursor: m.status==='live'?'pointer':'not-allowed', fontSize: 13, fontWeight: 700, color: m.status==='pending_resolution'?C.gray:C.blue }}>{m.sideA_name}</button>
            <button onClick={() => m.status==='live' && onBet?.(m, 'B')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: m.status==='pending_resolution'?C.grayLight:C.redPale, border: 'none', cursor: m.status==='live'?'pointer':'not-allowed', fontSize: 13, fontWeight: 700, color: m.status==='pending_resolution'?C.gray:C.red }}>{m.sideB_name}</button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(m.options ?? []).map(opt => {
            const total = (m.options ?? []).reduce((a, o) => a + o.pool, 0)
            const pct = total > 0 ? Math.round(opt.pool / total * 100) : 0
            return (
              <button key={opt.id} onClick={() => onBet?.(m, opt.id)} style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: `1px solid ${C.grayBorder}`, background: C.grayLight, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, flex: 1, textAlign: 'left' as const }}>{opt.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{pct}%</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
