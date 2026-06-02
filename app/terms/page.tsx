'use client'
import { useRouter } from 'next/navigation'
import { C } from '@/lib/constants'

const SECTIONS = [
  { title: '제1조 (목적)', content: '이 약관은 Futuring(이하 "서비스")이 제공하는 예측 마켓 플랫폼 서비스의 이용과 관련하여 서비스와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.' },
  { title: '제2조 (정의)', content: '① "서비스"란 Futuring이 제공하는 예측 마켓, 포인트 거래 등 일체의 서비스를 말합니다.\n② "이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.\n③ "포인트"란 서비스 내에서 사용되는 가상의 재화로, 현금으로 환전되지 않습니다.' },
  { title: '제3조 (약관의 효력)', content: '이 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다. 이용자는 서비스에 가입하거나 이용함으로써 이 약관에 동의한 것으로 간주됩니다.' },
  { title: '제4조 (포인트 이용)', content: '① 포인트는 서비스 내 예측 마켓 참여 등에 사용됩니다.\n② 포인트는 유상으로 구매하거나 서비스 이용을 통해 획득할 수 있습니다.\n③ 포인트는 현금으로 환전되지 않으며, 계정 삭제 시 소멸됩니다.' },
  { title: '제5조 (금지행위)', content: '이용자는 다음 행위를 해서는 안 됩니다.\n① 타인의 계정 도용 또는 정보 침해\n② 서비스의 정상적인 운영을 방해하는 행위\n③ 불법적인 목적의 서비스 이용\n④ 허위 정보 유포 또는 마켓 조작' },
  { title: '제6조 (서비스 변경 및 중단)', content: '서비스는 운영상, 기술상 이유로 서비스의 내용을 변경하거나 중단할 수 있으며, 이에 대해 이용자에게 사전 고지합니다.' },
  { title: '제7조 (면책조항)', content: '서비스는 예측 마켓의 결과에 대한 책임을 지지 않습니다. 포인트 거래 및 예측 참여는 이용자의 자유의사에 의한 것이며, 서비스는 투자 조언을 제공하지 않습니다.' },
]

export default function TermsPage() {
  const router = useRouter()
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFF' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
        <button onClick={() => router.back()} style={{ fontSize: 14, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}>← 뒤로</button>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>이용약관</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 40 }}>최종 업데이트: 2026년 6월 1일</p>
        {SECTIONS.map(s => (
          <div key={s.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>{s.title}</h2>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line' as const }}>{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
