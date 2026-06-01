'use client'
import { useState } from 'react'
import { usePledgeStore } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import { C } from '@/lib/constants'

const PRESETS = [1000, 5000, 10000, 50000, 100000]

export default function TransferPage() {
  const { walletBalance, currentUser } = usePledgeStore()
  const device = useDevice(); const isMobile = device === 'mobile'
  const router = useRouter()
  const Nav = isMobile ? FuturingNav : PCNav

  const [targetUser, setTargetUser] = useState('')
  const [amount, setAmount] = useState(10000)
  const [custom, setCustom] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [memo, setMemo] = useState('')
  const [step, setStep] = useState<'input' | 'confirm' | 'done'>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [receiverInfo, setReceiverInfo] = useState<{ username: string; id: string } | null>(null)

  const finalAmount = useCustom ? (Number(custom) || 0) : amount
  const canNext = targetUser.trim() && finalAmount > 0 && finalAmount <= walletBalance && finalAmount <= 1_000_000

  const handleSearch = async () => {
    setError('')
    const { data } = await supabase.from('profiles').select('id, username').eq('username', targetUser.trim()).single()
    if (!data) { setError('존재하지 않는 아이디예요'); return }
    if (data.id === currentUser.userId) { setError('자신에게는 송금할 수 없어요'); return }
    setReceiverInfo({ username: data.username, id: data.id })
    setStep('confirm')
  }

  const handleTransfer = async () => {
    if (!receiverInfo || !currentUser.userId || loading) return
    setLoading(true)
    try {
      // 송금자 잔액 차감
      const { data: sender } = await supabase.from('profiles').select('wallet_balance').eq('id', currentUser.userId).single()
      if (!sender || sender.wallet_balance < finalAmount) { setError('잔액이 부족해요'); setLoading(false); return }

      await supabase.from('profiles').update({ wallet_balance: sender.wallet_balance - finalAmount }).eq('id', currentUser.userId)

      // 수신자 잔액 추가
      const { data: receiver } = await supabase.from('profiles').select('wallet_balance').eq('id', receiverInfo.id).single()
      if (receiver) {
        await supabase.from('profiles').update({ wallet_balance: receiver.wallet_balance + finalAmount }).eq('id', receiverInfo.id)
      }

      // 로컬 상태 업데이트
      usePledgeStore.setState({ walletBalance: sender.wallet_balance - finalAmount })

      // 수신자에게 알림
      const { createNotification } = await import('@/lib/notifications')
      await createNotification(receiverInfo.id, 'admin', '💸 포인트 송금 도착',
        `@${currentUser.username}님이 ${finalAmount.toLocaleString()}P를 보냈어요!${memo ? ` "${memo}"` : ''}`)

      setStep('done')
    } catch {
      setError('송금 중 오류가 발생했어요')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: isMobile ? '24px 16px 100px' : '48px 24px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.navy, marginBottom: 4 }}>💸 포인트 송금</h1>
          <p style={{ fontSize: 14, color: C.gray }}>다른 유저에게 포인트를 보내세요</p>
        </div>

        {step === 'input' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: C.bluePale, borderRadius: 16, padding: '16px 20px', border: `1px solid ${C.blueMid2}` }}>
              <p style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>보유 잔액</p>
              <p style={{ fontSize: 26, fontWeight: 900, color: C.navy }}>{walletBalance.toLocaleString()} P</p>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 8 }}>받는 사람 아이디</label>
              <input value={targetUser} onChange={e => setTargetUser(e.target.value)}
                placeholder="아이디 입력"
                style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 15, boxSizing: 'border-box' as const, outline: 'none' }} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 8 }}>금액</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                {PRESETS.map(p => (
                  <button key={p} onClick={() => { setAmount(p); setUseCustom(false) }}
                    style={{ padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: !useCustom && amount === p ? C.navy : C.grayLight, color: !useCustom && amount === p ? '#fff' : C.gray }}>
                    {p >= 10000 ? `${p / 10000}만` : `${p / 1000}천`}P
                  </button>
                ))}
                <button onClick={() => setUseCustom(true)}
                  style={{ padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: useCustom ? C.navy : C.grayLight, color: useCustom ? '#fff' : C.gray }}>직접입력</button>
              </div>
              {useCustom && (
                <input type="number" value={custom} onChange={e => setCustom(e.target.value)}
                  placeholder="금액 입력 (최대 100만P)"
                  style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 15, boxSizing: 'border-box' as const, outline: 'none' }} />
              )}
              {finalAmount > walletBalance && <p style={{ fontSize: 12, color: C.red, marginTop: 6 }}>잔액이 부족해요</p>}
              {finalAmount > 1_000_000 && <p style={{ fontSize: 12, color: C.red, marginTop: 6 }}>1회 최대 100만P까지 가능해요</p>}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 8 }}>메모 (선택)</label>
              <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="예) 내기 결과 ㅋㅋ"
                style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 15, boxSizing: 'border-box' as const, outline: 'none' }} />
            </div>

            {error && <p style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>{error}</p>}

            <button onClick={handleSearch} disabled={!canNext}
              style={{ padding: '15px 0', borderRadius: 14, background: canNext ? C.blue : C.grayLight, color: canNext ? '#fff' : C.gray, border: 'none', cursor: canNext ? 'pointer' : 'not-allowed', fontSize: 15, fontWeight: 800, boxShadow: canNext ? '0 4px 16px rgba(29,78,216,0.25)' : 'none' }}>
              다음 →
            </button>
          </div>
        )}

        {step === 'confirm' && receiverInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: C.white, borderRadius: 20, padding: 24, border: `1.5px solid ${C.grayBorder}` }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.gray, marginBottom: 16 }}>송금 내역 확인</p>
              {[
                ['받는 사람', `@${receiverInfo.username}`],
                ['송금 금액', `${finalAmount.toLocaleString()} P`],
                ['메모', memo || '없음'],
                ['송금 후 잔액', `${(walletBalance - finalAmount).toLocaleString()} P`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.grayBorder}` }}>
                  <span style={{ fontSize: 14, color: C.gray }}>{l}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#FFF7ED', borderRadius: 12, padding: '12px 16px', border: '1px solid #FED7AA' }}>
              <p style={{ fontSize: 13, color: '#C2410C', fontWeight: 600 }}>⚠️ 송금 후 취소가 불가능해요. 신중하게 확인하세요.</p>
            </div>

            {error && <p style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setStep('input'); setError('') }}
                style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: C.grayLight, color: C.gray, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>취소</button>
              <button onClick={handleTransfer} disabled={loading}
                style={{ flex: 2, padding: '14px 0', borderRadius: 14, background: loading ? C.grayLight : C.blue, color: loading ? C.gray : '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 800 }}>
                {loading ? '처리 중...' : '💸 송금하기'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
            <p style={{ fontSize: 22, fontWeight: 900, color: C.navy, marginBottom: 8 }}>송금 완료!</p>
            <p style={{ fontSize: 15, color: C.gray, marginBottom: 8 }}>@{receiverInfo?.username}에게</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: C.blue, marginBottom: 32 }}>{finalAmount.toLocaleString()} P</p>
            <button onClick={() => router.push('/')}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800 }}>
              홈으로 →
            </button>
          </div>
        )}
      </div>
      {isMobile && <BottomNav />}
    </div>
  )
}
