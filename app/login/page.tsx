'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import { supabase } from '@/lib/supabase'
import { C } from '@/lib/constants'

export default function LoginPage() {
  const router = useRouter()
  const { login, signup } = usePledgeStore()
  const device = useDevice()
  const isMobile = device === 'mobile'
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError('')
    if (!username.trim()) return setError('아이디를 입력해주세요')
    if (!password.trim()) return setError('비밀번호를 입력해주세요')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    if (tab === 'signup') {
      if (password !== passwordConfirm) { setLoading(false); return setError('비밀번호가 일치하지 않아요') }
      if (password.length < 6) { setLoading(false); return setError('비밀번호는 6자 이상이어야 해요') }
      const ok = await signup(username, password)
      if (!ok) { setLoading(false); return setError('이미 사용 중인 아이디예요') }
      await login(username, password)
      router.push('/')
    } else {
      const ok = await login(username, password)
      if (!ok) { setLoading(false); return setError('아이디 또는 비밀번호가 틀렸어요') }
      const state = usePledgeStore.getState()
      router.push(state.currentUser.isAdmin ? '/admin' : '/')
    }
    setLoading(false)
  }

  // 소셜 로그인 — Supabase OAuth
  const handleSocialLogin = async (provider: 'kakao' | 'google') => {
    setSocialLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: provider === 'kakao' ? 'profile_nickname profile_image account_email' : undefined,
        },
      })
      if (error) setError(error.message)
    } catch {
      setError('소셜 로그인에 실패했어요')
    } finally {
      setSocialLoading(null)
    }
  }

  const form = (
    <div>
      <div style={{ display: 'flex', background: C.grayLight, borderRadius: 14, padding: 4, marginBottom: 24 }}>
        {(['login', 'signup'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setError('') }} style={{ flex: 1, padding: '11px 0', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, background: tab === t ? C.white : 'transparent', color: tab === t ? C.navy : C.gray, boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
            {t === 'login' ? '로그인' : '회원가입'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {([
          ['아이디', username, setUsername, 'text', '아이디를 입력하세요'],
          ['비밀번호', password, setPassword, 'password', '비밀번호를 입력하세요'],
          ...(tab === 'signup' ? [['비밀번호 확인', passwordConfirm, setPasswordConfirm, 'password', '비밀번호를 다시 입력하세요']] : []),
        ] as [string, string, (v: string) => void, string, string][]).map(([label, value, setter, type, ph]) => (
          <div key={label}>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.navy2, display: 'block', marginBottom: 6 }}>{label}</label>
            <input type={type} value={value} onChange={e => setter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder={ph}
              style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 14, color: C.navy, background: C.white, boxSizing: 'border-box' as const, outline: 'none' }} />
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: C.redPale, border: `1px solid #FECACA`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: C.red, fontWeight: 600 }}>{error}</div>
      )}

      <button onClick={handleSubmit} disabled={loading}
        style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: loading ? C.grayLight : C.blue, color: loading ? C.gray : C.white, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 800, marginBottom: 20, boxShadow: loading ? 'none' : '0 4px 16px rgba(29,78,216,0.3)', transition: 'all 0.15s' }}>
        {loading ? '처리중...' : tab === 'login' ? '로그인' : '회원가입'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: C.grayBorder }} /><span style={{ fontSize: 12, color: C.gray }}>또는</span><div style={{ flex: 1, height: 1, background: C.grayBorder }} />
      </div>

      {/* 소셜 로그인 버튼 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* 카카오 */}
        <button
          onClick={() => handleSocialLogin('kakao')}
          disabled={!!socialLoading}
          style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: socialLoading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, background: '#FEE500', color: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: socialLoading && socialLoading !== 'kakao' ? 0.6 : 1 }}>
          {socialLoading === 'kakao' ? '연결 중...' : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.374c0 2.052 1.368 3.852 3.432 4.878l-.876 3.276c-.078.294.252.528.51.366L8.43 13.53c.186.018.372.03.57.03 4.142 0 7.5-2.634 7.5-5.874C16.5 4.134 13.142 1.5 9 1.5z" fill="#191919"/>
              </svg>
              카카오로 시작하기
            </>
          )}
        </button>

        {/* 구글 */}
        <button
          onClick={() => handleSocialLogin('google')}
          disabled={!!socialLoading}
          style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, cursor: socialLoading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, background: C.white, color: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: socialLoading && socialLoading !== 'google' ? 0.6 : 1 }}>
          {socialLoading === 'google' ? '연결 중...' : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google로 시작하기
            </>
          )}
        </button>
      </div>

      <p style={{ fontSize: 11, color: C.gray, textAlign: 'center' as const, marginTop: 16 }}>
        소셜 로그인은 Supabase Authentication 설정 후 활성화됩니다
      </p>
    </div>
  )

  if (isMobile) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <img src="/logo.png" alt="futuring" style={{ height: 40, objectFit: 'contain' }} />
        <p style={{ fontSize: 13, color: C.gray, marginTop: 8 }}>미래를 함께 예측하는 커뮤니티</p>
      </div>
      <div style={{ width: '100%', maxWidth: 400, background: C.white, borderRadius: 24, padding: 28, boxShadow: '0 4px 40px rgba(29,78,216,0.08)', border: `1px solid ${C.grayBorder}` }}>
        {form}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div style={{ flex: 1, background: `linear-gradient(135deg,${C.navy} 0%,#1E3A8A 60%,${C.blueMid} 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ marginBottom: 40 }}><img src="/logo.png" alt="futuring" style={{ height: 48, objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: 40 }} /></div>
        <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.4, marginBottom: 16, letterSpacing: '-0.02em' }}>미래를 함께<br />예측하세요</p>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.8, maxWidth: 320 }}>커뮤니티와 함께 이슈를 예측하고<br />포인트로 수익을 만들어보세요.</p>
        <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
          {[['10K+', '참여자'], ['500+', '마켓'], ['98%', '만족도']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>{v}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 64px', background: C.bg }}>
        {form}
      </div>
    </div>
  )
}
