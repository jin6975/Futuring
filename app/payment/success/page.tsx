'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { C } from '@/lib/constants'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { currentUser, loadUserData } = usePledgeStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [pointsAdded, setPointsAdded] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')
    const packageId = searchParams.get('packageId')

    if (!paymentKey || !orderId || !amount || !currentUser.userId) {
      setStatus('error'); setErrorMsg('결제 정보가 올바르지 않아요'); return
    }

    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), userId: currentUser.userId, packageId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setPointsAdded(data.pointsAdded)
          setStatus('success')
          if (currentUser.userId) loadUserData(currentUser.userId)
        } else {
          setStatus('error'); setErrorMsg(data.error ?? '결제 처리 실패')
        }
      })
      .catch(() => { setStatus('error'); setErrorMsg('서버 오류가 발생했어요') })
  }, [searchParams, currentUser.userId, loadUserData])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 24, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
            <p style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>결제 확인 중...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
            <p style={{ fontSize: 22, fontWeight: 900, color: C.navy, marginBottom: 8 }}>충전 완료!</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: C.blue, marginBottom: 24 }}>+{pointsAdded.toLocaleString()} P</p>
            <button onClick={() => router.push('/')} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800 }}>
              홈으로 →
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
            <p style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginBottom: 8 }}>결제 실패</p>
            <p style={{ fontSize: 14, color: C.gray, marginBottom: 24 }}>{errorMsg}</p>
            <button onClick={() => router.push('/shop')} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800 }}>
              다시 시도
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return <Suspense><SuccessContent /></Suspense>
}
