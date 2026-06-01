'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePledgeStore, type WhaleBattle } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import CommunityFeed from '@/components/CommunityFeed'
import TradingChart from '@/components/TradingChart'
import { C } from '@/lib/constants'

const GOLD_MID = '#D97706'; const GOLD_PALE = '#FFFBEB'; const GOLD = '#F59E0B'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

export default function BattleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const device = useDevice(); const isMobile = device === 'mobile'
  const { walletBalance, whaleBattles, betOnBattle, currentUser, loadWhaleBattles } = usePledgeStore()
  const Nav = isMobile ? FuturingNav : PCNav

  const [betAmt, setBetAmt] = useState(5000)
  const [customAmt, setCustomAmt] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [myBets, setMyBets] = useState<{ side: 'challenger' | 'defender'; amt: number }[]>([])
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadWhaleBattles() }, [loadWhaleBattles])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2500)
  }

  const battle: WhaleBattle | undefined = (whaleBattles as WhaleBattle[]).find(b => b.id === id)

  if (!battle) return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <button onClick={() => router.back()} style={{ padding: '10px 24px', borderRadius: 12, background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>돌아가기</button>
      </div>
    </div>
  )

  const total = battle.poolFor + battle.poolAgainst
  const pctC = total > 0 ? Math.round(battle.poolFor / total * 100) : 50
  const finalAmt = useCustom ? (Number(customAmt) || 0) : betAmt
  const canBet = finalAmt > 0 && finalAmt <= walletBalance && battle.status !== 'ended'

  const myChallenger = myBets.filter(b => b.side === 'challenger').reduce((s, b) => s + b.amt, 0)
  const myDefender = myBets.filter(b => b.side === 'defender').reduce((s, b) => s + b.amt, 0)

  const handleBet = async (side: 'challenger' | 'defender') => {
    if (!canBet || loading) return
    if (!currentUser.isLoggedIn) { showToast('로그인이 필요해요', 'error'); return }
    setLoading(true)
    try {
      await betOnBattle(battle.id, side, finalAmt)
      setMyBets(prev => [...prev, { side, amt: finalAmt }])
      showToast(`⚔️ @${side === 'challenger' ? battle.challenger : battle.defender}에 ${finalAmt.toLocaleString()}P 베팅!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '베팅 실패', 'error')
    }
    setLoading(false)
  }

  const BetPanel = (
    <div style={{ background: C.white, borderRadius: 20, padding: 20, border: `1.5px solid ${C.grayBorder}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>응원 베팅</p>
        <span style={{ fontSize: 12, color: C.gray }}>잔액 {walletBalance.toLocaleString()}P</span>
      </div>
      {battle.status === 'ended' ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: C.gray, fontSize: 14 }}>
          배틀이 종료되었습니다.{battle.winnerId && ` 승자: @${battle.winnerId}`}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {[1000, 5000, 10000, 50000].filter(p => p <= walletBalance || p === 1000).map(p => (
              <button key={p} onClick={() => { setBetAmt(p); setUseCustom(false) }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: !useCustom && betAmt === p ? C.navy : C.grayLight, color: !useCustom && betAmt === p ? '#fff' : C.gray }}>
                {fmt(p)}
              </button>
            ))}
            <button onClick={() => setUseCustom(true)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: useCustom ? C.navy : C.grayLight, color: useCustom ? '#fff' : C.gray }}>
              직접
            </button>
          </div>
          {useCustom && (
            <input type="number" value={customAmt} onChange={e => setCustomAmt(e.target.value)}
              placeholder="금액 입력" style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 14, color: C.navy, background: C.grayLight, marginBottom: 8, boxSizing: 'border-box' as const, outline: 'none' }} />
          )}
          {myBets.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {myChallenger > 0 && <div style={{ flex: 1, background: `${battle.challengerColor}12`, borderRadius: 10, padding: '6px 10px', fontSize: 11, fontWeight: 700, color: battle.challengerColor, textAlign: 'center' as const }}>@{battle.challenger}<br />{fmt(myChallenger)}P</div>}
              {myDefender > 0 && <div style={{ flex: 1, background: `${battle.defenderColor}12`, borderRadius: 10, padding: '6px 10px', fontSize: 11, fontWeight: 700, color: battle.defenderColor, textAlign: 'center' as const }}>@{battle.defender}<br />{fmt(myDefender)}P</div>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleBet('challenger')} disabled={!canBet || loading}
              style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: `2px solid ${battle.challengerColor}`, cursor: canBet ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 800, background: myChallenger > 0 ? `${battle.challengerColor}18` : C.white, color: battle.challengerColor, opacity: canBet ? 1 : 0.5 }}>
              {battle.challengerBadge}<br />@{battle.challenger}<br /><span style={{ fontSize: 12 }}>{pctC}%</span>
            </button>
            <button onClick={() => handleBet('defender')} disabled={!canBet || loading}
              style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: `2px solid ${battle.defenderColor}`, cursor: canBet ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 800, background: myDefender > 0 ? `${battle.defenderColor}18` : C.white, color: battle.defenderColor, opacity: canBet ? 1 : 0.5 }}>
              {battle.defenderBadge}<br />@{battle.defender}<br /><span style={{ fontSize: 12 }}>{100 - pctC}%</span>
            </button>
          </div>
        </>
      )}
    </div>
  )

  const InfoPanel = (
    <div style={{ background: C.white, borderRadius: 20, padding: 22, border: `1px solid ${C.grayBorder}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.gray, fontWeight: 600, padding: 0 }}>← 고래 배틀</button>
        <span style={{ fontSize: 11, fontWeight: 700, background: battle.status === 'ended' ? C.grayLight : '#FEF2F2', color: battle.status === 'ended' ? C.gray : C.red, padding: '3px 10px', borderRadius: 99 }}>
          {battle.status === 'ended' ? '⏹ 종료' : '⚔️ LIVE'}
        </span>
        <span style={{ fontSize: 12, color: C.gray }}>{battle.condition}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        <div style={{ background: `${battle.challengerColor}12`, borderRadius: 14, padding: '14px 10px', textAlign: 'center' as const, border: `2px solid ${battle.challengerColor}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: battle.challengerColor, marginBottom: 4 }}>{battle.challengerBadge}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>@{battle.challenger}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: battle.challengerColor, marginTop: 4 }}>{pctC}%</div>
          <div style={{ fontSize: 11, color: C.gray }}>{fmt(battle.poolFor)}P</div>
          {battle.status === 'ended' && battle.winnerId === battle.challenger && <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginTop: 4 }}>🏆 승리</div>}
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.gray, textAlign: 'center' as const }}>VS</div>
        <div style={{ background: `${battle.defenderColor}12`, borderRadius: 14, padding: '14px 10px', textAlign: 'center' as const, border: `2px solid ${battle.defenderColor}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: battle.defenderColor, marginBottom: 4 }}>{battle.defenderBadge}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>@{battle.defender}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: battle.defenderColor, marginTop: 4 }}>{100 - pctC}%</div>
          <div style={{ fontSize: 11, color: C.gray }}>{fmt(battle.poolAgainst)}P</div>
          {battle.status === 'ended' && battle.winnerId === battle.defender && <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginTop: 4 }}>🏆 승리</div>}
        </div>
      </div>
      <div style={{ background: GOLD_PALE, borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', border: `1px solid #FDE68A` }}>
        <div><p style={{ fontSize: 11, color: GOLD_MID, fontWeight: 600 }}>🏆 상금</p><p style={{ fontSize: 16, fontWeight: 900, color: GOLD_MID }}>{fmt(battle.prize)}P</p></div>
        <div style={{ textAlign: 'right' as const }}><p style={{ fontSize: 11, color: GOLD_MID, fontWeight: 600 }}>총 응원풀</p><p style={{ fontSize: 16, fontWeight: 900, color: GOLD_MID }}>{fmt(total)}P</p></div>
      </div>
    </div>
  )

  if (isMobile) return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      {toast && <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? C.red : C.navy, color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap' as const }}>{toast.msg}</div>}
      <div style={{ padding: '16px 16px 0' }}>{InfoPanel}</div>
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ borderRadius: 16, overflow: 'hidden' }}><TradingChart currentPct={pctC} seed={42} compact /></div>
      </div>
      <div style={{ padding: '12px 16px 0' }}>{BetPanel}</div>
      <div style={{ padding: '12px 16px 100px' }}>
        <CommunityFeed topic={`battle-${id}`} title={`@${battle.challenger} vs @${battle.defender}`} compact />
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      {toast && <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? C.red : C.navy, color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap' as const }}>{toast.msg}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, maxWidth: 1200, margin: '0 auto', padding: '32px 32px 60px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {InfoPanel}
          <div style={{ borderRadius: 16, overflow: 'hidden' }}><TradingChart currentPct={pctC} seed={42} /></div>
          {BetPanel}
        </div>
        <div style={{ position: 'sticky', top: 80, height: 'calc(100vh - 100px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: C.white, borderRadius: 20, border: `1px solid ${C.grayBorder}` }}>
          <CommunityFeed topic={`battle-${id}`} title={`@${battle.challenger} vs @${battle.defender}`} />
        </div>
      </div>
    </div>
  )
}
