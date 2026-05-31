'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { usePledgeStore, type Debate, type Side } from '@/store/usePledgeStore'

const BLUE = '#2563EB'
const BLUE_BG = '#EFF6FF'
const RED = '#DC2626'
const RED_BG = '#FEF2F2'
const GREEN = '#16A34A'
const GREEN_BG = '#F0FDF4'

export interface BetBottomSheetProps {
  debate: Debate | null
  side: Side | null
  onClose: () => void
}

// 포인트 부족 모달
function InsufficientModal({ onClose, onShop }: { onClose: () => void; onShop: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 340, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', textAlign: 'center' as const }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>포인트가 부족해요</h3>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>베팅하려면 포인트가 더 필요해요.<br/>상점에서 포인트를 충전해보세요!</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>확인</button>
          <button onClick={onShop} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>상점으로 이동</button>
        </div>
      </div>
    </div>
  )
}

export default function BetBottomSheet({ debate, side, onClose }: BetBottomSheetProps) {
  const makePledge = usePledgeStore((s) => s.makePledge)
  const walletBalance = usePledgeStore((s) => s.walletBalance)
  const isLoggedIn = usePledgeStore((s) => s.currentUser.isLoggedIn)
  const [rawAmount, setRawAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [showInsufficient, setShowInsufficient] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const isYes = side === 'A'
  const accent = isYes ? BLUE : RED
  const accentBg = isYes ? BLUE_BG : RED_BG
  const sideLabel = isYes ? 'YES' : 'NO'

  const numericAmount = parseInt(rawAmount.replace(/,/g, ''), 10)
  const isValid = !isNaN(numericAmount) && numericAmount > 0 && numericAmount <= walletBalance
  const multiplier = debate ? (isYes ? debate.metrics.payoutMultiplierA : debate.metrics.payoutMultiplierB) : 1
  const estimatedReturn = isValid ? Math.floor(numericAmount * multiplier) : 0
  const profit = isValid ? estimatedReturn - numericAmount : 0

  useEffect(() => {
    if (debate && side) {
      setRawAmount('')
      setStatus('idle')
      setErrMsg('')
      setTimeout(() => inputRef.current?.focus(), 320)
    }
  }, [debate, side])

  useEffect(() => {
    if (debate) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [debate])

  const handleAdd = (n: number) => {
    const current = parseInt(rawAmount.replace(/,/g, ''), 10) || 0
    setRawAmount(Math.min(current + n, walletBalance).toLocaleString('ko-KR'))
  }

  const handleMax = () => setRawAmount(walletBalance.toLocaleString('ko-KR'))

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    if (!digits) { setRawAmount(''); return }
    setRawAmount(parseInt(digits, 10).toLocaleString('ko-KR'))
  }

  const handleConfirm = async () => {
    if (!debate || !side) return
    if (!isLoggedIn) { onClose(); router.push('/login'); return }
    if (!isValid) {
      if (!isNaN(numericAmount) && numericAmount > walletBalance) {
        setShowInsufficient(true)
        return
      }
      return
    }
    try {
      await makePledge(debate.id, side, numericAmount)
      setStatus('success')
      setTimeout(() => { onClose(); setStatus('idle') }, 1600)
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : '오류가 발생했어요')
      setStatus('error')
    }
  }

  if (!debate || !side) return null

  return (
    <>
      {showInsufficient && (
        <InsufficientModal
          onClose={() => setShowInsufficient(false)}
          onShop={() => { setShowInsufficient(false); onClose(); router.push('/shop') }}
        />
      )}
      <AnimatePresence>
        <motion.div
          key="backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
        />
        <motion.div
          key="sheet"
          style={{
            position: 'fixed', bottom: 0, left: '50%', zIndex: 50,
            transform: 'translateX(-50%)', width: '100%', maxWidth: 448,
            background: '#fff', borderRadius: '28px 28px 0 0',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          }}
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <div style={{ width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 9999 }} />
          </div>

          <div style={{ padding: '12px 24px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginBottom: 4 }}>예측 중</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.4, maxWidth: 260 }}>{debate.topic}</p>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: accentBg, borderRadius: 12, padding: '8px 16px', alignSelf: 'flex-start' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: accent }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: accent }}>{sideLabel}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: `${accent}99` }}>
                {Math.round((isYes ? debate.metrics.impliedProbA : debate.metrics.impliedProbB) * 100)}% 확률
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: '#D1D5DB' }}>P</span>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  value={rawAmount}
                  onChange={handleInput}
                  placeholder="0"
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 48, fontWeight: 800, color: '#111827', width: 200, textAlign: 'center', caretColor: accent }}
                />
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>잔액: {walletBalance.toLocaleString('ko-KR')} P</p>
              {!isNaN(numericAmount) && numericAmount > walletBalance && (
                <p style={{ fontSize: 12, fontWeight: 600, color: RED }}>잔액 초과 — 포인트가 부족해요</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {[1000, 5000, 10000].map((n) => (
                <button key={n} onClick={() => handleAdd(n)} disabled={walletBalance < n}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 9999, backgroundColor: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: walletBalance < n ? 0.3 : 1 }}>
                  +{(n / 1000).toFixed(0)}K
                </button>
              ))}
              <button onClick={handleMax} disabled={walletBalance === 0}
                style={{ flex: 1, padding: '8px 0', borderRadius: 9999, backgroundColor: accentBg, color: accent, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: walletBalance === 0 ? 0.3 : 1 }}>
                최대
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16, backgroundColor: isValid ? GREEN_BG : '#F9FAFB', transition: 'background-color 0.2s ease' }}>
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>예상 수령액</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: isValid ? GREEN : '#D1D5DB' }}>
                  {isValid ? `${estimatedReturn.toLocaleString('ko-KR')} P` : '— P'}
                </p>
              </div>
              {isValid && (
                <div style={{ textAlign: 'right' as const }}>
                  <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>수익</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>+{profit.toLocaleString('ko-KR')} P</p>
                </div>
              )}
            </div>

            {status === 'error' && <p style={{ fontSize: 14, fontWeight: 500, color: RED, textAlign: 'center' as const }}>{errMsg}</p>}

            {status === 'success' ? (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ width: '100%', padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GREEN_BG, borderRadius: 18 }}>
                <span style={{ fontSize: 20 }}>✓</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: GREEN }}>베팅 완료!</span>
              </motion.div>
            ) : (
              <button onClick={handleConfirm} disabled={!isValid}
                style={{ width: '100%', padding: '16px 0', fontSize: 16, fontWeight: 700, color: '#fff', backgroundColor: isValid ? accent : '#E5E7EB', border: 'none', borderRadius: 18, cursor: isValid ? 'pointer' : 'not-allowed', boxShadow: isValid ? `0 4px 16px ${isYes ? '#2563EB50' : '#DC262650'}` : 'none', transition: 'all 0.2s' }}>
                베팅 {sideLabel} {isValid ? `· ${numericAmount.toLocaleString('ko-KR')} P` : ''}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
