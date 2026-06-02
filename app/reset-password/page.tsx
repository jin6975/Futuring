'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { C } from '@/lib/constants'

function ResetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'request' | 'sent' | 'reset' | 'done'>('request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 이메일 링크로 접근 시 reset 단계로
  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'recovery') setStep('reset')
  }, [searchParams])

  const handleRequest = async () => {
    if (!email.trim()) return setError('이메일을 입력해주세요')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(
      `${email.trim()}@futuring-user.com`,
      { redirectTo: `${window.location.origin}/reset-password?type=recovery` }
    )
    setLoading(false)
    if (error) return setError('아이디를 찾을 수 없어요')
    setStep('sent')
  }

  const handleReset = async () => {
    if (password.length < 6) return setError('비밀번호는 6자 이상이어야 해요')
    if (password !== passwordConfirm) return setError('비밀번호가 일치하지 않아요')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return setError('비밀번호 변경에 실패했어요')
    setStep('done')
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 400, background: C.white, borderRadius: 24, padding: 36, boxShadow: '0 4px 40px rgba(29,78,216,0.08)', border: `1px solid ${C.grayBorder}` }}>

        {step === 'request' && (
          <>
            <p style={{ fontSize: 22, fontWeight: 900, color: C.navy, marginBottom: 6 }}>🔑 비밀번호 찾기</p>
            <p style={{ fontSize: 14, color: C.gray, marginBottom: 28 }}>가입한 아이디를 입력하면 이메일로 재설정 링크를 보내드려요</p>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 8 }}>아이디</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="아이디 입력"
              style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 15, boxSizing: 'border-box' as const, outline: 'none', marginBottom: 16 }} />
            {error && <p style={{ fontSize: 13, color: C.red, marginBottom: 12 }}>{error}</p>}
            <button onClick={handleRequest} disabled={loading}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800, marginBottom: 12 }}>
              {loading ? '처리 중...' : '재설정 링크 받기'}
            </button>
            <button onClick={() => router.push('/login')}
              style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: C.grayLight, color: C.gray, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              로그인으로 돌아가기
            </button>
          </>
        )}

        {step === 'sent' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>📧</div>
            <p style={{ fontSize: 20, fontWeight: 900, color: C.navy, marginBottom: 8 }}>이메일을 확인해주세요</p>
            <p style={{ fontSize: 14, color: C.gray, marginBottom: 24, lineHeight: 1.6 }}>재설정 링크를 이메일로 보냈어요.<br />링크를 클릭해서 비밀번호를 변경하세요.</p>
            <button onClick={() => router.push('/login')}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800 }}>
              로그인 페이지로
            </button>
          </div>
        )}

        {step === 'reset' && (
          <>
            <p style={{ fontSize: 22, fontWeight: 900, color: C.navy, marginBottom: 6 }}>🔒 새 비밀번호 설정</p>
            <p style={{ fontSize: 14, color: C.gray, marginBottom: 28 }}>새로운 비밀번호를 입력해주세요</p>
            {[
              ['새 비밀번호', password, setPassword],
              ['비밀번호 확인', passwordConfirm, setPasswordConfirm],
            ].map(([label, val, setter]) => (
              <div key={String(label)} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 8 }}>{String(label)}</label>
                <input type="password" value={String(val)} onChange={e => (setter as (v: string) => void)(e.target.value)}
                  style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 15, boxSizing: 'border-box' as const, outline: 'none' }} />
              </div>
            ))}
            {error && <p style={{ fontSize: 13, color: C.red, marginBottom: 12 }}>{error}</p>}
            <button onClick={handleReset} disabled={loading}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800 }}>
              {loading ? '처리 중...' : '비밀번호 변경하기'}
            </button>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <p style={{ fontSize: 20, fontWeight: 900, color: C.navy, marginBottom: 8 }}>비밀번호 변경 완료</p>
            <p style={{ fontSize: 14, color: C.gray, marginBottom: 24 }}>새 비밀번호로 로그인해주세요</p>
            <button onClick={() => router.push('/login')}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800 }}>
              로그인하러 가기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetContent /></Suspense>
}
