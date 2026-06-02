'use client'
import { useRouter } from 'next/navigation'

const SECTIONS = [
  { title: '1. 수집하는 개인정보', content: '서비스는 다음의 개인정보를 수집합니다.\n• 필수항목: 아이디(이메일), 비밀번호\n• 소셜 로그인 시: 프로필 이름, 이메일\n• 서비스 이용 시 자동 수집: 접속 IP, 쿠키, 서비스 이용 기록' },
  { title: '2. 개인정보 이용 목적', content: '수집한 개인정보는 다음의 목적으로 사용합니다.\n• 회원 관리 및 서비스 제공\n• 서비스 개선 및 신규 서비스 개발\n• 법령에 의한 의무 이행' },
  { title: '3. 개인정보 보유 기간', content: '서비스는 개인정보 수집 목적이 달성된 후에는 지체 없이 파기합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.' },
  { title: '4. 개인정보의 제3자 제공', content: '서비스는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 법령에 의한 요청이 있는 경우는 예외로 합니다.' },
  { title: '5. 이용자의 권리', content: '이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 수집 및 이용에 대한 동의를 철회할 수 있습니다. 계정 삭제를 통해 개인정보 삭제를 요청할 수 있습니다.' },
  { title: '6. 쿠키 사용', content: '서비스는 서비스 개선을 위해 쿠키를 사용합니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.' },
  { title: '7. 개인정보 보호 책임자', content: '개인정보 관련 문의는 서비스 내 고객지원을 통해 접수해주세요.' },
]

export default function PrivacyPage() {
  const router = useRouter()
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFF' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
        <button onClick={() => router.back()} style={{ fontSize: 14, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}>← 뒤로</button>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>개인정보처리방침</h1>
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
