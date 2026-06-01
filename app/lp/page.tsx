'use client'
import { useState, useEffect } from 'react'
import { usePledgeStore, LP_POOLS, type LpPosition } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import { C } from '@/lib/constants'

const PRESETS = [10_000, 50_000, 100_000, 500_000]
const DAY_MS = 86_400_000

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

function calcAccrued(pos: LpPosition, apy: number): number {
  const elapsed = (Date.now() - pos.createdAt) / DAY_MS
  return Math.floor(pos.amount * (apy / 100) * (elapsed / 365))
}

// ── 예치 확인 모달 ──────────────────────────────────
function ConfirmModal({ pool, amount, onConfirm, onCancel }: {
  pool: typeof LP_POOLS[0]; amount: number; onConfirm: () => void; onCancel: () => void
}) {
  const daily   = Math.round(amount * pool.apy / 100 / 365)
  const monthly = Math.round(amount * pool.apy / 100 / 12)
  const yearly  = Math.round(amount * pool.apy / 100)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:C.white, borderRadius:24, padding:28, width:'100%', maxWidth:400, boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:C.bluePale, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{pool.icon}</div>
          <div>
            <p style={{ fontSize:11, color:C.gray, fontWeight:600 }}>LP 예치 확인</p>
            <p style={{ fontSize:17, fontWeight:900, color:C.navy }}>{pool.market}</p>
          </div>
        </div>
        <div style={{ background:C.bluePale, borderRadius:14, padding:'14px 18px', marginBottom:16, border:`1px solid ${C.blueMid2}` }}>
          <p style={{ fontSize:12, color:C.blue, fontWeight:600, marginBottom:4 }}>예치 금액</p>
          <p style={{ fontSize:26, fontWeight:900, color:C.navy }}>{amount.toLocaleString()} P</p>
        </div>
        <div style={{ background:C.greenPale, borderRadius:14, padding:'16px 18px', marginBottom:16, border:'1px solid #A7F3D0' }}>
          <p style={{ fontSize:13, fontWeight:800, color:'#065F46', marginBottom:12 }}>📈 예상 수익 (APY {pool.apy}%)</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[{label:'일 수익',val:daily},{label:'월 수익',val:monthly},{label:'연 수익',val:yearly}].map(({label,val})=>(
              <div key={label} style={{ background:'rgba(255,255,255,0.7)', borderRadius:10, padding:'10px 8px', textAlign:'center' as const }}>
                <p style={{ fontSize:10, color:'#065F46', fontWeight:600, marginBottom:4 }}>{label}</p>
                <p style={{ fontSize:14, fontWeight:900, color:C.green }}>+{fmt(val)}P</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize:11, color:'#065F46', marginTop:10, opacity:0.7 }}>* 예치 기간에 따라 실시간으로 수익이 쌓입니다.</p>
        </div>
        <div style={{ background:'#FFFBEB', borderRadius:12, padding:'10px 14px', marginBottom:20, border:'1px solid #FDE68A' }}>
          <p style={{ fontSize:12, color:'#92400E', fontWeight:600 }}>⚠️ 예치 즉시 수익 발생, 언제든 회수 가능합니다.</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:'14px 0', borderRadius:14, border:`1.5px solid ${C.grayBorder}`, background:C.white, color:C.gray, fontSize:15, fontWeight:700, cursor:'pointer' }}>취소</button>
          <button onClick={onConfirm} style={{ flex:2, padding:'14px 0', borderRadius:14, border:'none', background:`linear-gradient(135deg,${C.blueMid},${C.blue})`, color:C.white, fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 16px rgba(29,78,216,0.3)' }}>💧 예치하기</button>
        </div>
      </div>
    </div>
  )
}

// ── 내 포지션 카드 ──────────────────────────────────
function MyPositionCard({ pos, onWithdraw }: { pos: LpPosition; onWithdraw: () => void }) {
  const pool = LP_POOLS.find(p => p.id === pos.poolId)
  const [accrued, setAccrued] = useState(0)
  useEffect(() => {
    const update = () => setAccrued(calcAccrued(pos, pool?.apy ?? 10))
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [pos, pool])
  if (!pool) return null
  const days = ((Date.now() - pos.createdAt) / DAY_MS).toFixed(1)
  return (
    <div style={{ background:`linear-gradient(135deg,${C.bluePale},#E0F2FE)`, borderRadius:16, padding:16, border:`1.5px solid ${C.blueMid2}`, marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>{pool.icon}</span>
          <div>
            <p style={{ fontSize:13, fontWeight:800, color:C.navy }}>{pool.market}</p>
            <p style={{ fontSize:11, color:C.gray }}>{days}일 전 예치 · APY {pool.apy}%</p>
          </div>
        </div>
        <span style={{ fontSize:13, fontWeight:800, color:C.green, background:C.greenPale, padding:'4px 10px', borderRadius:99 }}>APY {pool.apy}%</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
        <div style={{ background:'rgba(255,255,255,0.8)', borderRadius:10, padding:'10px 8px', textAlign:'center' as const }}>
          <p style={{ fontSize:10, color:C.gray, marginBottom:3 }}>원금</p>
          <p style={{ fontSize:14, fontWeight:800, color:C.navy }}>{fmt(pos.amount)}P</p>
        </div>
        <div style={{ background:'rgba(255,255,255,0.8)', borderRadius:10, padding:'10px 8px', textAlign:'center' as const }}>
          <p style={{ fontSize:10, color:C.gray, marginBottom:3 }}>누적 수익</p>
          <p style={{ fontSize:14, fontWeight:800, color:C.green }}>+{fmt(accrued)}P</p>
        </div>
        <div style={{ background:'rgba(255,255,255,0.8)', borderRadius:10, padding:'10px 8px', textAlign:'center' as const }}>
          <p style={{ fontSize:10, color:C.gray, marginBottom:3 }}>총 회수액</p>
          <p style={{ fontSize:14, fontWeight:800, color:C.blue }}>{fmt(pos.amount + accrued)}P</p>
        </div>
      </div>
      <button onClick={onWithdraw}
        style={{ width:'100%', padding:'11px 0', borderRadius:12, border:`1.5px solid ${C.blue}`, background:C.white, color:C.blue, fontSize:13, fontWeight:800, cursor:'pointer' }}>
        💰 회수하기 (+{fmt(accrued)}P 수익 포함)
      </button>
    </div>
  )
}

// ── 풀 카드 ────────────────────────────────────────
function PoolCard({ pool, walletBalance, onDeposit, totalDeposited }: {
  pool: typeof LP_POOLS[0]; walletBalance: number; onDeposit: (pool: typeof LP_POOLS[0], amount: number) => void; totalDeposited: number
}) {
  const [amount, setAmount] = useState(50_000)
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const finalAmount = showCustom ? (Number(custom) || 0) : amount
  const canDeposit = finalAmount > 0 && finalAmount <= walletBalance

  return (
    <div style={{ background:C.white, borderRadius:20, border:`1.5px solid ${C.grayBorder}`, padding:22, boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:C.bluePale, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{pool.icon}</div>
          <div>
            <p style={{ fontSize:16, fontWeight:800, color:C.navy }}>{pool.market}</p>
            <p style={{ fontSize:12, color:C.gray, marginTop:2 }}>{pool.desc}</p>
          </div>
        </div>
        <span style={{ fontSize:14, fontWeight:800, color:C.green, background:C.greenPale, padding:'5px 12px', borderRadius:99, flexShrink:0 }}>APY {pool.apy}%</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
        <div style={{ background:C.grayLight, borderRadius:12, padding:'12px 14px' }}>
          <p style={{ fontSize:11, color:C.gray, marginBottom:4 }}>내 예치금</p>
          <p style={{ fontSize:17, fontWeight:800, color:C.navy }}>{totalDeposited > 0 ? `${fmt(totalDeposited)}P` : '없음'}</p>
        </div>
        <div style={{ background:C.bluePale, borderRadius:12, padding:'12px 14px' }}>
          <p style={{ fontSize:11, color:C.blue, marginBottom:4 }}>연 수익률</p>
          <p style={{ fontSize:17, fontWeight:800, color:C.blue }}>{pool.apy}%</p>
        </div>
      </div>
      <p style={{ fontSize:12, fontWeight:700, color:C.gray, marginBottom:8 }}>예치 금액 선택</p>
      <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' as const }}>
        {PRESETS.map(a => (
          <button key={a} onClick={() => { setAmount(a); setShowCustom(false) }} style={{ flex:1, minWidth:60, padding:'9px 0', borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background:!showCustom&&amount===a?C.navy:C.grayLight, color:!showCustom&&amount===a?C.white:C.gray }}>{fmt(a)}P</button>
        ))}
        <button onClick={() => setShowCustom(true)} style={{ flex:1, minWidth:60, padding:'9px 0', borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background:showCustom?C.navy:C.grayLight, color:showCustom?C.white:C.gray }}>직접입력</button>
      </div>
      {showCustom && (
        <input type="number" value={custom} onChange={e => setCustom(e.target.value)} placeholder="예치할 포인트 입력"
          style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:`1.5px solid ${C.grayBorder}`, fontSize:14, color:C.navy, background:C.grayLight, marginBottom:8, boxSizing:'border-box' as const, outline:'none' }} />
      )}
      <p style={{ fontSize:12, color:C.gray, marginBottom:12 }}>
        보유 잔액: <strong style={{ color:canDeposit?C.navy:C.red }}>{walletBalance.toLocaleString()} P</strong>
        {finalAmount > walletBalance && <span style={{ color:C.red }}> · 잔액 부족</span>}
      </p>
      <button onClick={() => canDeposit && onDeposit(pool, finalAmount)} disabled={!canDeposit}
        style={{ width:'100%', padding:'14px 0', borderRadius:14, border:'none', background:canDeposit?`linear-gradient(135deg,${C.blueMid},${C.blue})`:C.grayLight, color:canDeposit?C.white:C.gray, fontSize:15, fontWeight:800, cursor:canDeposit?'pointer':'not-allowed', boxShadow:canDeposit?'0 4px 16px rgba(29,78,216,0.25)':'none', transition:'all 0.15s' }}>
        💧 유동성 예치하기
      </button>
    </div>
  )
}

// ── 메인 ────────────────────────────────────────────
export default function LPPage() {
  const { walletBalance, currentUser, lpPositions, depositLp, withdrawLp, loadLpPositions } = usePledgeStore()
  const device = useDevice(); const isMobile = device === 'mobile'
  const Nav = isMobile ? FuturingNav : PCNav
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirm, setConfirm] = useState<{ pool: typeof LP_POOLS[0]; amount: number } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUser.userId) loadLpPositions()
  }, [currentUser.userId, loadLpPositions])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const handleConfirm = async () => {
    if (!confirm || loading) return
    setLoading(true)
    try {
      await depositLp(confirm.pool.id, confirm.amount)
      showToast(`✅ ${confirm.pool.market}에 ${confirm.amount.toLocaleString()}P 예치 완료!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '예치에 실패했어요', 'error')
    }
    setConfirm(null)
    setLoading(false)
  }

  const handleWithdraw = async (posId: string) => {
    if (loading) return
    setLoading(true)
    try {
      await withdrawLp(posId)
      showToast('✅ 회수 완료! 수익이 지갑에 입금됐어요')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '회수에 실패했어요', 'error')
    }
    setLoading(false)
  }

  const totalTvl = lpPositions.reduce((s: number, p: LpPosition) => s + p.amount, 0)

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Nav />
      {toast && <div style={{ position:'fixed', top:72, left:'50%', transform:'translateX(-50%)', background:toast.type==='error'?C.red:C.navy, color:'#fff', padding:'12px 20px', borderRadius:12, fontSize:14, fontWeight:700, zIndex:998, whiteSpace:'nowrap' as const }}>{toast.msg}</div>}
      {confirm && <ConfirmModal pool={confirm.pool} amount={confirm.amount} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />}

      <div style={{ padding:isMobile?'20px 16px 100px':'32px 40px 60px', maxWidth:760, margin:'0 auto' }}>
        {/* 헤더 */}
        <div style={{ background:`linear-gradient(135deg,${C.navy} 0%,#1E3A8A 100%)`, borderRadius:24, padding:isMobile?'24px 20px':'32px 36px', marginBottom:24, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>💧</div>
            <div>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', letterSpacing:'0.08em', fontWeight:700 }}>LIQUIDITY POOL</p>
              <h1 style={{ fontSize:isMobile?20:26, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>LP 예치</h1>
            </div>
          </div>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.65)', lineHeight:1.7, maxWidth:480 }}>
            마켓 유동성 풀에 포인트를 예치하고 APY 수익을 실시간으로 수령하세요.<br />
            예치 기간에 비례해 수익이 쌓이며 언제든 회수할 수 있습니다.
          </p>
          <div style={{ display:'flex', gap:12, marginTop:16 }}>
            <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 16px' }}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>내 잔액</p>
              <p style={{ fontSize:18, fontWeight:900, color:'#fff' }}>{walletBalance.toLocaleString()} P</p>
            </div>
            <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 16px' }}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>내 총 예치금</p>
              <p style={{ fontSize:18, fontWeight:900, color:C.blueMid }}>{fmt(totalTvl)} P</p>
            </div>
          </div>
        </div>

        <div style={{ background:C.bluePale, borderRadius:14, padding:'12px 16px', border:`1px solid ${C.blueMid2}`, marginBottom:20, fontSize:13, color:C.blue, fontWeight:600 }}>
          💧 예치 기간에 비례해 APY 수익이 실시간으로 쌓입니다. 회수 시 원금 + 수익이 지갑으로 입금됩니다.
        </div>

        {/* 내 포지션 */}
        {lpPositions.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <p style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:12 }}>📋 내 예치 포지션 ({lpPositions.length}개)</p>
            {(lpPositions as LpPosition[]).map(pos => (
              <MyPositionCard key={pos.id} pos={pos} onWithdraw={() => handleWithdraw(pos.id)} />
            ))}
          </div>
        )}

        {/* 풀 목록 */}
        <p style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:12 }}>💧 예치 가능 풀</p>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {LP_POOLS.map(pool => {
            const myDeposited = (lpPositions as LpPosition[]).filter(p => p.poolId === pool.id).reduce((s, p) => s + p.amount, 0)
            return (
              <PoolCard key={pool.id} pool={pool} walletBalance={walletBalance} onDeposit={(p, a) => setConfirm({ pool: p, amount: a })} totalDeposited={myDeposited} />
            )
          })}
        </div>
      </div>
      {isMobile && <BottomNav />}
    </div>
  )
}
