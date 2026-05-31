'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import CommunityFeed from '@/components/CommunityFeed'
import TradingChart from '@/components/TradingChart'
import MultiOptionBet from '@/components/MultiOptionBet'
import LoginModal from '@/components/LoginModal'
import { C } from '@/lib/constants'

// ── 토스트 ─────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
      background: type === 'success' ? C.navy : C.red,
      color: '#fff', padding: '12px 22px', borderRadius: 14,
      fontSize: 14, fontWeight: 700, zIndex: 999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
    }}>{message}</div>
  )
}

// ── 메인 ───────────────────────────────────────────
export default function MarketPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const device = useDevice()
  const isMobile = device === 'mobile'
  const { debates, makePledge, walletBalance, currentUser } = usePledgeStore()
  const debate = debates.find(d => d.id === id)
  const isLoggedIn = currentUser.isLoggedIn

  const [side, setSide] = useState<'A' | 'B' | null>(null)
  const [amount, setAmount] = useState(1000)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    if (walletBalance > 0) setAmount(Math.max(1000, Math.min(5000, Math.floor(walletBalance * 0.1))))
  }, [walletBalance])

  const PRESETS = [1000, 5000, 10000, 50000].filter(p => p <= walletBalance || p === 1000)

  const pctA = debate ? Math.round(debate.metrics.impliedProbA * 100) : 50
  const pctB = 100 - pctA
  const activePct = side === 'A' ? pctA : side === 'B' ? pctB : null
  const expectedProfit = activePct && amount > 0 ? Math.round(amount * (100 / activePct - 1)) : 0

  const handleBet = () => {
    if (!isLoggedIn) { setShowLoginModal(true); return }
    if (!side || !debate) return
    if (amount <= 0) { showToast('베팅 금액을 입력해주세요', 'error'); return }
    if (amount > walletBalance) { showToast('잔액이 부족해요', 'error'); return }
    try {
      makePledge(debate.id, side, amount)
      showToast(`✅ ${side === 'A' ? debate.sideA_name : debate.sideB_name}에 ${amount.toLocaleString()} P 베팅 완료!`)
      setSide(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했어요', 'error')
    }
  }

  const handleMultiBet = (optionId: string, betAmount: number) => {
    if (!isLoggedIn) { setShowLoginModal(true); return }
    if (!debate) return
    try {
      makePledge(debate.id, optionId as any, betAmount)
      const optName = debate.options?.find(o => o.id === optionId)?.name ?? optionId
      showToast(`✅ ${optName}에 ${betAmount.toLocaleString()} P 베팅 완료!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했어요', 'error')
    }
  }

  const Nav = isMobile ? FuturingNav : PCNav

  if (!debate) return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 20, color: C.gray }}>마켓을 찾을 수 없어요</p>
        <button onClick={() => router.back()} style={{ padding: '10px 24px', borderRadius: 12, background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>돌아가기</button>
      </div>
    </div>
  )

  const isBinary = debate.type === 'binary'

  // ── 베팅 패널 ──────────────────────────────────
  const BetPanel = (
    <div style={{ background: C.white, borderRadius: 20, padding: 20, border: `1.5px solid ${side ? C.blue : C.grayBorder}`, transition: 'border-color 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>내 예측</p>
        <span style={{ fontSize: 12, color: C.gray }}>잔액 {walletBalance.toLocaleString()} P</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['A', 'B'] as const).map(s => (
          <button key={s} onClick={() => setSide(s)} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, background: side === s ? (s === 'A' ? C.blue : C.red) : (s === 'A' ? C.bluePale : C.redPale), color: side === s ? C.white : (s === 'A' ? C.blue : C.red), transition: 'all 0.15s' }}>
            {s === 'A' ? `YES ${pctA}%` : `NO ${pctB}%`}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {PRESETS.map(p => (
          <button key={p} onClick={() => setAmount(p)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: amount === p ? (side === 'A' ? C.blue : side === 'B' ? C.red : C.navy) : C.grayLight, color: amount === p ? C.white : C.gray }}>
            {p >= 1000 ? `${p / 1000}K` : p}
          </button>
        ))}
      </div>
      <input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} placeholder="직접 입력" style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 14, color: C.navy, background: C.grayLight, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }} />
      {side && amount > 0 && (
        <div style={{ background: amount <= walletBalance ? C.greenPale : C.redPale, borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, color: amount <= walletBalance ? C.green : C.red, fontWeight: 600 }}>{amount <= walletBalance ? '예상 수익' : '⚠ 잔액 초과'}</p>
            <p style={{ fontSize: 17, fontWeight: 900, color: amount <= walletBalance ? C.green : C.red }}>{amount <= walletBalance ? `+${expectedProfit.toLocaleString()} P` : `${(amount - walletBalance).toLocaleString()} P 부족`}</p>
          </div>
          {amount <= walletBalance && activePct && <p style={{ fontSize: 13, color: C.green, fontWeight: 700, alignSelf: 'flex-end' }}>{(100 / activePct).toFixed(2)}x</p>}
        </div>
      )}
      <button onClick={handleBet} disabled={!side || amount <= 0 || amount > walletBalance} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: !side || amount <= 0 || amount > walletBalance ? C.grayLight : side === 'A' ? C.blue : C.red, color: !side || amount <= 0 || amount > walletBalance ? C.gray : C.white, border: 'none', cursor: !side || amount <= 0 || amount > walletBalance ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 800, transition: 'all 0.15s', boxShadow: side && amount > 0 && amount <= walletBalance ? `0 4px 16px ${side === 'A' ? 'rgba(29,78,216,0.3)' : 'rgba(239,68,68,0.3)'}` : 'none' }}>
        {!side ? '방향을 선택하세요' : amount > walletBalance ? '잔액 부족' : `${side === 'A' ? 'YES' : 'NO'} ${amount.toLocaleString()} P 베팅`}
      </button>
    </div>
  )

  // ── 차트 + 마켓 정보 패널 ──────────────────────
  const ChartPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.gray, fontWeight: 600, padding: 0, width: 'fit-content' }}>← 뒤로</button>
      <div style={{ background: C.white, borderRadius: 20, padding: 22, border: `1px solid ${C.grayBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: C.gray, fontWeight: 600 }}>{debate.category}</span>
          <span style={{ fontSize: 11, background: '#F0FDF4', color: C.green, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>● Live</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.gray }}>📅 {new Date(debate.resolvesAt).toLocaleDateString('ko-KR')} 마감</span>
        </div>
        <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: C.navy, lineHeight: 1.4, marginBottom: 14, letterSpacing: '-0.02em' }}>{debate.topic}</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: C.gray, marginBottom: 16 }}>
          <span>📊 {debate.metrics.totalPool.toLocaleString()} P 거래량</span>
        </div>
        <TradingChart currentPct={pctA} />
      </div>
      {debate.description && (
        <div style={{ background: C.white, borderRadius: 20, padding: 20, border: `1px solid ${C.grayBorder}` }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>마켓 설명</p>
          <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.7 }}>{debate.description}</p>
        </div>
      )}
    </div>
  )

  // ── 모바일 레이아웃 ────────────────────────────
  if (isMobile) return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      {toast && <Toast message={toast.msg} type={toast.type} />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} message="베팅하려면 로그인이 필요해요" />}
      <div style={{ padding: '16px 16px 0' }}>{ChartPanel}</div>
      {debate.status === 'live' && (
        <div style={{ padding: '12px 16px' }}>
          {isBinary
            ? BetPanel
            : <MultiOptionBet debate={debate} walletBalance={walletBalance} isLoggedIn={isLoggedIn} onBet={handleMultiBet} onLoginRequired={() => setShowLoginModal(true)} />
          }
        </div>
      )}
      <div style={{ padding: '0 16px 100px' }}>
        <CommunityFeed topic={debate.id} title={debate.topic} compact />
      </div>
      <BottomNav />
    </div>
  )

  // ── PC 레이아웃: 3열 고정 (차트 | 베팅 | 커뮤니티) ──
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      {toast && <Toast message={toast.msg} type={toast.type} />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} message="베팅하려면 로그인이 필요해요" />}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px 300px',
        gap: 20,
        maxWidth: 1280,
        margin: '0 auto',
        padding: '32px 32px 60px',
        alignItems: 'start',
      }}>
        {/* 1열: 차트 + 마켓 정보 */}
        {ChartPanel}

        {/* 2열: 베팅 패널 */}
        {debate.status === 'live' && (
          <div style={{ position: 'sticky', top: 80 }}>
            {isBinary
              ? BetPanel
              : <MultiOptionBet debate={debate} walletBalance={walletBalance} isLoggedIn={isLoggedIn} onBet={handleMultiBet} onLoginRequired={() => setShowLoginModal(true)} />
            }
          </div>
        )}

        {/* 3열: 커뮤니티 - 항상 보임, 스크롤 고정 */}
        <div style={{ position: 'sticky', top: 80, height: 'calc(100vh - 100px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: C.white, borderRadius: 20, border: `1px solid ${C.grayBorder}` }}>
            <CommunityFeed topic={debate.id} title={debate.topic} />
          </div>
        </div>
      </div>
    </div>
  )
}
