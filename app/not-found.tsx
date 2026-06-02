'use client'
import { useRouter } from 'next/navigation'
import { C } from '@/lib/constants'

export default function NotFound() {
  const router = useRouter()
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 80, marginBottom: 20 }}>🔮</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: C.navy, marginBottom: 8 }}>404</h1>
      <p style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>페이지를 찾을 수 없어요</p>
      <p style={{ fontSize: 14, color: C.gray, marginBottom: 32, lineHeight: 1.6 }}>주소를 다시 확인하거나<br />아래 버튼으로 홈으로 돌아가세요</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => router.back()}
          style={{ padding: '12px 24px', borderRadius: 12, background: C.grayLight, color: C.gray, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          뒤로 가기
        </button>
        <button onClick={() => router.push('/')}
          style={{ padding: '12px 24px', borderRadius: 12, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          홈으로 →
        </button>
      </div>
    </div>
  )
}
