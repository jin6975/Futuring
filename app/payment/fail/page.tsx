'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { C } from '@/lib/constants'

function FailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const message = searchParams.get('message') ?? '결제가 취소되었어요'
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 24, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>😢</div>
        <p style={{ fontSize: 20, fontWeight: 800, color: C.navy, marginBottom: 8 }}>결제 실패</p>
        <p style={{ fontSize: 14, color: C.gray, marginBottom: 24 }}>{message}</p>
        <button onClick={() => router.push('/shop')} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800 }}>
          돌아가기
        </button>
      </div>
    </div>
  )
}

export default function PaymentFailPage() {
  return <Suspense><FailContent /></Suspense>
}
