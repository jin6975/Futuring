'use client'
import { useState, useEffect } from 'react'
import { usePledgeStore, type WhaleBattle, type AuctionItem, type Bounty } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import { useRouter } from 'next/navigation'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import CommunityFeed from '@/components/CommunityFeed'
import AuctionCard from '@/components/AuctionCard'
import { TierBadge } from '@/components/TierBadge'
import { C } from '@/lib/constants'

const WHALE_THRESHOLD = 50_000
const GOLD = '#F59E0B'; const GOLD_MID = '#D97706'; const GOLD_PALE = '#FFFBEB'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

function useCountdown(endAt: number) {
  const [r, setR] = useState(endAt - Date.now())
  useEffect(() => { const id = setInterval(() => setR(endAt - Date.now()), 1000); return () => clearInterval(id) }, [endAt])
  const s = Math.max(0, Math.floor(r / 1000))
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const CONDITIONS = ['수익률 대결', '예측 적중률', '거래량 대결', '커뮤니티 좋아요']
const DURATIONS = [{ label: '1일', val: 24 }, { label: '3일', val: 72 }, { label: '7일', val: 168 }, { label: '14일', val: 336 }, { label: '30일', val: 720 }]
const PRIZES = [10_000, 30_000, 50_000, 100_000, 200_000]

function DeclareWarForm({ username, balance, onSubmit, onClose }: {
  username: string; balance: number; onSubmit: (data: { defender: string; condition: string; duration: number; prize: number }) => void; onClose: () => void
}) {
  const [defender, setDefender] = useState('')
  const [condition, setCondition] = useState(CONDITIONS[0])
  const [duration, setDuration] = useState(168)
  const [prize, setPrize] = useState(30_000)
  return (
    <div style={{ background: C.white, borderRadius: 20, padding: 24, border: `2px solid ${GOLD}`, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div><p style={{ fontSize: 18, fontWeight: 900, color: C.navy }}>⚔️ 선전포고</p><p style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>다른 고래에게 도전장을 내밀어보세요</p></div>
        <button onClick={onClose} style={{ background: C.grayLight, border: 'none', cursor: 'pointer', borderRadius: 10, width: 34, height: 34, fontSize: 16 }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.navy2, display: 'block', marginBottom: 6 }}>도전 상대 (@아이디)</label>
          <input value={defender} onChange={e => setDefender(e.target.value)} placeholder="상대방 아이디" style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.navy2, display: 'block', marginBottom: 8 }}>대결 조건</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {CONDITIONS.map(c => <button key={c} onClick={() => setCondition(c)} style={{ padding: '10px', borderRadius: 10, border: `1.5px solid ${condition === c ? GOLD_MID : C.grayBorder}`, background: condition === c ? GOLD_PALE : C.white, color: condition === c ? GOLD_MID : C.gray, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{c}</button>)}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.navy2, display: 'block', marginBottom: 8 }}>기간</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {DURATIONS.map(d => <button key={d.val} onClick={() => setDuration(d.val)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: duration === d.val ? C.navy : C.grayLight, color: duration === d.val ? '#fff' : C.gray }}>{d.label}</button>)}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.navy2, display: 'block', marginBottom: 8 }}>상금 (패자→승자)</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            {PRIZES.filter(p => p <= balance).map(p => <button key={p} onClick={() => setPrize(p)} style={{ padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: prize === p ? GOLD_MID : C.grayLight, color: prize === p ? '#fff' : C.gray }}>{fmt(p)}P</button>)}
          </div>
        </div>
        <div style={{ background: GOLD_PALE, borderRadius: 12, padding: '12px 16px', border: `1px solid #FDE68A` }}>
          <p style={{ fontSize: 12, color: GOLD_MID, fontWeight: 600 }}>📣 @{username} → @{defender || '???'} · {condition} · {DURATIONS.find(d => d.val === duration)?.label} · 상금 {fmt(prize)}P</p>
        </div>
        <button
          onClick={() => defender.trim() && prize <= balance && onSubmit({ defender, condition, duration, prize })}
          disabled={!defender.trim() || prize > balance}
          style={{ padding: '13px 0', borderRadius: 14, background: defender.trim() && prize <= balance ? `linear-gradient(135deg,${GOLD_MID},${GOLD})` : '#F1F5F9', color: defender.trim() && prize <= balance ? '#fff' : C.gray, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800 }}>
          ⚔️ 선전포고 보내기
        </button>
      </div>
    </div>
  )
}

function BattleCard({ battle }: { battle: WhaleBattle }) {
  const router = useRouter()
  const countdown = useCountdown(battle.endAt)
  const total = battle.poolFor + battle.poolAgainst
  const pctC = total > 0 ? Math.round(battle.poolFor / total * 100) : 50
  const pctD = 100 - pctC

  return (
    <div
      onClick={() => router.push(`/whale/battle/${battle.id}`)}
      style={{ background: C.white, borderRadius: 20, border: `1.5px solid ${C.grayBorder}`, padding: 20, marginBottom: 12, cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.borderColor = C.blue }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = C.grayBorder }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.gray }}>⚔️ {battle.condition}</span>
        {battle.status === 'ended'
          ? <span style={{ fontSize: 12, fontWeight: 700, color: C.gray }}>종료됨</span>
          : <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>⏱ {countdown}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <div style={{ background: `${battle.challengerColor}10`, borderRadius: 14, padding: '14px 10px', textAlign: 'center' as const, border: `2px solid ${battle.challengerColor}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: battle.challengerColor, marginBottom: 4 }}>{battle.challengerBadge}</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.navy }}>@{battle.challenger}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: battle.challengerColor, marginTop: 6 }}>{pctC}%</div>
          <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{fmt(battle.poolFor)}P</div>
          {battle.status === 'ended' && battle.winnerId === battle.challenger && <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginTop: 4 }}>🏆 승리</div>}
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.gray, textAlign: 'center' as const }}>VS</div>
        <div style={{ background: `${battle.defenderColor}10`, borderRadius: 14, padding: '14px 10px', textAlign: 'center' as const, border: `2px solid ${battle.defenderColor}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: battle.defenderColor, marginBottom: 4 }}>{battle.defenderBadge}</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.navy }}>@{battle.defender}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: battle.defenderColor, marginTop: 6 }}>{pctD}%</div>
          <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{fmt(battle.poolAgainst)}P</div>
          {battle.status === 'ended' && battle.winnerId === battle.defender && <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginTop: 4 }}>🏆 승리</div>}
        </div>
      </div>
      <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', display: 'flex', marginBottom: 14 }}>
        <div style={{ width: `${pctC}%`, background: battle.challengerColor, transition: 'width 0.6s' }} />
        <div style={{ flex: 1, background: battle.defenderColor }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: GOLD_MID }}>🏆 {fmt(battle.prize)}P</span>
          <span style={{ fontSize: 12, color: C.gray }}>총 {fmt(total)}P 응원</span>
        </div>
        {battle.status !== 'ended' && (
          <div style={{ background: `linear-gradient(135deg,${C.blueMid},${C.blue})`, color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 20px', borderRadius: 12, boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>
            ⚔️ 베팅하기
          </div>
        )}
      </div>
    </div>
  )
}

export default function WhalePage() {
  const { walletBalance, currentUser, whaleBattles, auctions, bounties, createWhaleBattle, placeBid, participateBounty, loadWhaleBattles, loadAuctions, loadBounties } = usePledgeStore()
  const device = useDevice(); const isMobile = device === 'mobile'
  const router = useRouter()
  const isWhale = walletBalance >= WHALE_THRESHOLD
  const [tab, setTab] = useState<'battle' | 'auction' | 'bounty'>('battle')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showDeclare, setShowDeclare] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadWhaleBattles()
    loadAuctions()
    loadBounties()
  }, [loadWhaleBattles, loadAuctions, loadBounties])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2500)
  }

  const handleDeclare = async (data: { defender: string; condition: string; duration: number; prize: number }) => {
    if (loading) return
    setLoading(true)
    try {
      await createWhaleBattle(data.defender, data.condition, data.duration, data.prize)
      setShowDeclare(false)
      showToast(`⚔️ @${data.defender}에게 선전포고 발송!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '실패했어요', 'error')
    }
    setLoading(false)
  }

  const handleAuctionBid = async (itemId: string, amt: number) => {
    if (loading) return
    setLoading(true)
    try {
      await placeBid(itemId, amt)
      showToast(`✅ ${amt.toLocaleString()}P 입찰 완료!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '입찰 실패', 'error')
    }
    setLoading(false)
  }

  const handleParticipate = async (bountyId: string) => {
    if (loading) return
    setLoading(true)
    try {
      await participateBounty(bountyId)
      showToast('🎯 현상금 참여 완료!')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '참여 실패', 'error')
    }
    setLoading(false)
  }

  const Nav = isMobile ? FuturingNav : PCNav

  if (!isWhale) return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: `linear-gradient(135deg,${GOLD_MID},${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 24 }}>🐋</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.navy, marginBottom: 10 }}>고래 전용 구역</h1>
        <p style={{ fontSize: 15, color: C.gray, marginBottom: 8, maxWidth: 300 }}>{WHALE_THRESHOLD.toLocaleString()}P 이상 보유 시 입장 가능해요.</p>
        <p style={{ fontSize: 14, color: C.blue, fontWeight: 700, marginBottom: 32 }}>현재 잔액: {walletBalance.toLocaleString()}P ({Math.round(walletBalance / WHALE_THRESHOLD * 100)}%)</p>
        <div style={{ width: '100%', maxWidth: 300, height: 8, borderRadius: 99, background: C.grayBorder, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, walletBalance / WHALE_THRESHOLD * 100)}%`, background: `linear-gradient(90deg,${C.blueMid},${GOLD})` }} />
        </div>
        <button onClick={() => router.push('/')} style={{ padding: '14px 32px', borderRadius: 14, background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>마켓에서 포인트 벌기 →</button>
      </div>
      {isMobile && <BottomNav />}
    </div>
  )

  const TABS = [
    { id: 'battle', label: '⚔️ 고래 배틀' },
    { id: 'auction', label: '🏆 군주 경매' },
    { id: 'bounty', label: '💰 현상금' },
  ] as const

  const mainContent = (
    <div style={{ padding: isMobile ? '20px 16px 100px' : '0' }}>
      <div style={{ background: `linear-gradient(135deg,#1C1917 0%,#292524 100%)`, borderRadius: 20, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${GOLD_MID},${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🐋</div>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', fontWeight: 700 }}>WHALE ZONE</p>
            <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#fff' }}>고래 전용 놀이터</h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>내 잔액</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: GOLD }}>{fmt(walletBalance)}P</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px' }}>
            <TierBadge points={walletBalance} size="md" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flexShrink: 0, padding: '10px 18px', borderRadius: 12, border: `1.5px solid ${tab === t.id ? C.navy : C.grayBorder}`, cursor: 'pointer', background: tab === t.id ? C.navy : C.white, color: tab === t.id ? '#fff' : C.gray, fontSize: 13, fontWeight: 700 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 배틀 탭 */}
      {tab === 'battle' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: '#FEF2F2', borderRadius: 14, padding: '12px 16px', border: '1px solid #FECACA', fontSize: 13, color: C.red, fontWeight: 600 }}>
              ⚔️ 고래끼리 대결 — 개미도 응원 베팅으로 참여!
            </div>
            <button onClick={() => setShowDeclare(!showDeclare)} style={{ flexShrink: 0, padding: '12px 18px', borderRadius: 12, background: `linear-gradient(135deg,${GOLD_MID},${GOLD})`, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800 }}>
              ⚔️ 선전포고
            </button>
          </div>
          {showDeclare && <DeclareWarForm username={currentUser.username} balance={walletBalance} onSubmit={handleDeclare} onClose={() => setShowDeclare(false)} />}
          {(whaleBattles as WhaleBattle[]).length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: C.white, borderRadius: 20, border: `1px solid ${C.grayBorder}` }}>
              <p style={{ fontSize: 15, color: C.gray }}>진행 중인 배틀이 없어요. 선전포고를 보내보세요!</p>
            </div>
          )}
          {(whaleBattles as WhaleBattle[]).map(b => <BattleCard key={b.id} battle={b} />)}
        </div>
      )}

      {/* 경매 탭 */}
      {tab === 'auction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: GOLD_PALE, borderRadius: 14, padding: '12px 16px', border: `1px solid #FDE68A`, fontSize: 13, color: GOLD_MID, fontWeight: 600 }}>⚠️ 입찰 후 취소 불가. 낙찰 시 포인트 즉시 차감. 이전 최고 입찰자에게 자동 환불됩니다.</div>
          {(auctions as AuctionItem[]).filter(a => a.status === 'live').length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: C.white, borderRadius: 20, border: `1px solid ${C.grayBorder}` }}>
              <p style={{ fontSize: 15, color: C.gray }}>진행 중인 경매가 없어요.</p>
            </div>
          )}
          {(auctions as AuctionItem[]).filter(a => a.status === 'live').map(item => (
            <AuctionCard key={item.id} item={item} balance={walletBalance} currentBid={item.topBid} currentBidder={item.topBidder} onBid={handleAuctionBid} />
          ))}
        </div>
      )}

      {/* 현상금 탭 */}
      {tab === 'bounty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(bounties as Bounty[]).length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: C.white, borderRadius: 20, border: `1px solid ${C.grayBorder}` }}>
              <p style={{ fontSize: 15, color: C.gray }}>진행 중인 현상금이 없어요.</p>
            </div>
          )}
          {(bounties as Bounty[]).map(b => {
            const daysLeft = Math.ceil((b.deadline - Date.now()) / (1000 * 60 * 60 * 24))
            const isResolved = b.status === 'resolved'
            return (
              <div key={b.id} style={{ background: C.white, borderRadius: 20, border: `1.5px solid ${isResolved ? C.grayBorder : C.grayBorder}`, padding: 20, opacity: isResolved ? 0.75 : 1 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: C.navy, marginBottom: 4 }}>{b.topic}</p>
                    <p style={{ fontSize: 12, color: C.gray }}>by @{b.sponsor}</p>
                  </div>
                  <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 12, padding: '8px 12px', textAlign: 'center', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: '#C2410C', fontWeight: 600 }}>보상</p>
                    <p style={{ fontSize: 16, fontWeight: 900, color: '#EA580C' }}>{fmt(b.reward)}P</p>
                  </div>
                </div>
                <div style={{ background: C.grayLight, borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: C.gray }}>🎯 {b.condition}</div>
                {isResolved && b.winnerId && (
                  <div style={{ background: C.greenPale, borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: 13, fontWeight: 700, color: C.green }}>
                    🏆 당첨자: @{b.winnerId}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 12, color: C.gray }}>👥 {b.participants}명</span>
                    {!isResolved && <span style={{ fontSize: 12, color: daysLeft <= 7 ? C.red : C.gray }}>⏰ {daysLeft}일 남음</span>}
                  </div>
                  {!isResolved && (
                    <button onClick={() => handleParticipate(b.id)} disabled={loading}
                      style={{ padding: '8px 18px', borderRadius: 10, background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>참여하기</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      {toast && <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? C.red : C.navy, color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap' as const }}>{toast.msg}</div>}
      {isMobile ? (
        <div>{mainContent}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: 'calc(100vh - 64px)' }}>
          <div style={{ overflowY: 'auto', padding: '32px 32px 60px' }}>{mainContent}</div>
          <div style={{ borderLeft: `1px solid ${C.grayBorder}`, background: C.white, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CommunityFeed topic="whale-lounge" title="고래 라운지 — 실시간 토론" />
          </div>
        </div>
      )}
      {isMobile && <BottomNav />}
    </div>
  )
}
