'use client'
import { usePledgeStore, type PledgePosition } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import { C } from '@/lib/constants'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ActivityPage() {
  const { ledger, positions, debates, walletBalance } = usePledgeStore()
  const device = useDevice(); const isMobile = device === 'mobile'
  const router = useRouter()

  const posArr = Object.values(positions) as PledgePosition[]
  const activePositions = posArr.filter(p => debates.find(x => x.id === p.debateId)?.status === 'live')
  const closedPositions = posArr.filter(p => { const d = debates.find(x => x.id === p.debateId); return d && d.status !== 'live' })

  const totalPledged = posArr.reduce((s, p) => s + p.totalPledged, 0)
  const totalPayout = ledger.filter(e => e.action === 'PAYOUT').reduce((s, e) => s + e.amount, 0)
  const pnl = totalPayout - totalPledged
  const winCount = ledger.filter(e => e.action === 'PAYOUT').length
  const totalBets = new Set(ledger.filter(e => e.action === 'PLEDGE').map(e => e.debateId)).size
  const winRate = totalBets > 0 ? Math.round((winCount / totalBets) * 100) : 0

  const Nav = isMobile ? FuturingNav : PCNav

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      <div style={isMobile ? { padding: '20px 16px 100px' } : { maxWidth: 900, margin: '0 auto', padding: '40px 40px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: C.navy }}>내 기록</h1>
          <Link href="/profile" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '8px 16px', borderRadius: 10, background: C.bluePale, color: C.blue, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>프로필 →</button>
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 24 }}>
          {[['보유 포인트', `${walletBalance.toLocaleString()} P`, false], [`${pnl >= 0 ? '+' : ''}${pnl.toLocaleString()} P`, '누적 수익', true], [`${totalBets}개`, '참여 마켓', false], [`${winRate}%`, '승률', false]].map(([v, l, h]) => (
            <div key={String(l)} style={{ background: h ? C.bluePale : C.white, borderRadius: 16, padding: '14px 16px', border: `1px solid ${h ? C.blueMid2 : C.grayBorder}` }}>
              <p style={{ fontSize: 11, color: h ? C.blue : C.gray, marginBottom: 4, fontWeight: 600 }}>{l}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: h ? C.blue : C.navy }}>{v}</p>
            </div>
          ))}
        </div>
        {activePositions.length > 0 && (
          <>
            <p style={{ fontSize: 15, fontWeight: 800, color: C.navy, marginBottom: 12 }}>진행 중 ({activePositions.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {activePositions.map(p => {
                const d = debates.find(x => x.id === p.debateId)!
                const sideName = d.type === 'multi' ? (d.options?.find(o => o.id === p.side)?.name ?? p.side) : p.side === 'A' ? d.sideA_name : d.sideB_name
                const pct = d.type === 'binary' ? (p.side === 'A' ? Math.round(d.metrics.impliedProbA * 100) : Math.round(d.metrics.impliedProbB * 100)) : null
                return (
                  <Link key={p.debateId} href={`/market/${p.debateId}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: C.white, borderRadius: 16, padding: 16, border: `1px solid ${C.grayBorder}` }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{d.topic}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.blue, background: C.bluePale, borderRadius: 7, padding: '3px 8px' }}>{sideName}</span>
                          <span style={{ fontSize: 12, color: C.gray }}>{p.totalPledged.toLocaleString()} P</span>
                          {pct && <span style={{ fontSize: 12, color: C.gray }}>현재 {pct}%</span>}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.greenPale, padding: '3px 8px', borderRadius: 99 }}>● 진행중</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
        {closedPositions.length > 0 && (
          <>
            <p style={{ fontSize: 15, fontWeight: 800, color: C.navy, marginBottom: 12 }}>완료됨 ({closedPositions.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {closedPositions.map(p => {
                const d = debates.find(x => x.id === p.debateId)!
                const isWin = d.resolvedSide === p.side
                const payout = ledger.find(e => e.debateId === p.debateId && e.action === 'PAYOUT')
                const sideName = d.type === 'multi' ? (d.options?.find(o => o.id === p.side)?.name ?? p.side) : p.side === 'A' ? d.sideA_name : d.sideB_name
                return (
                  <div key={p.debateId} style={{ background: C.white, borderRadius: 16, padding: 16, border: `1px solid ${C.grayBorder}` }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{d.topic}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.blue, background: C.bluePale, borderRadius: 7, padding: '3px 8px' }}>{sideName}</span>
                        <span style={{ fontSize: 12, color: C.gray }}>{p.totalPledged.toLocaleString()} P</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: isWin ? C.green : C.red }}>
                        {d.status === 'resolved' ? (isWin && payout ? `+${payout.amount.toLocaleString()}P ✅` : `-${p.totalPledged.toLocaleString()}P ❌`) : '환불'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
        {activePositions.length === 0 && closedPositions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: C.white, borderRadius: 20, border: `1px solid ${C.grayBorder}` }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>⚡</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 6 }}>아직 기록이 없어요</p>
            <Link href="/"><button style={{ padding: '10px 24px', borderRadius: 12, background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>마켓 둘러보기</button></Link>
          </div>
        )}
      </div>
      {isMobile && <BottomNav />}
    </div>
  )
}
