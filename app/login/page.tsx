'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import Image from 'next/image'
import { C } from '@/lib/constants'

export default function LoginPage() {
  const router = useRouter()
  const { login, signup } = usePledgeStore()
  const device = useDevice()
  const isMobile = device === 'mobile'
  const [tab, setTab] = useState<'login'|'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!username.trim()) return setError('아이디를 입력해주세요')
    if (!password.trim()) return setError('비밀번호를 입력해주세요')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    if (tab === 'signup') {
      if (password !== passwordConfirm) { setLoading(false); return setError('비밀번호가 일치하지 않아요') }
      if (password.length < 4) { setLoading(false); return setError('비밀번호는 4자 이상이어야 해요') }
      const ok = signup(username, password)
      if (!ok) { setLoading(false); return setError('이미 사용 중인 아이디예요') }
      login(username, password)
      router.push('/')
    } else {
      const ok = login(username, password)
      if (!ok) { setLoading(false); return setError('아이디 또는 비밀번호가 틀렸어요') }
      const state = usePledgeStore.getState()
      router.push(state.currentUser.isAdmin ? '/admin' : '/')
    }
    setLoading(false)
  }



  const form = (
    <div>
      <div style={{ display: 'flex', background: C.grayLight, borderRadius: 14, padding: 4, marginBottom: 24 }}>
        {(['login','signup'] as const).map(t => (
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
            <input type={type} value={value} onChange={e => setter(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder={ph}
              style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 14, color: C.navy, background: C.white, boxSizing: 'border-box', outline: 'none' }}/>
          </div>
        ))}
      </div>
      {error && <div style={{ background: C.redPale, border: `1px solid #FECACA`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: C.red, fontWeight: 600 }}>{error}</div>}
      <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: loading ? C.grayLight : C.blue, color: loading ? C.gray : C.white, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 800, marginBottom: 20, boxShadow: loading ? 'none' : '0 4px 16px rgba(29,78,216,0.3)', transition: 'all 0.15s' }}>
        {loading ? '처리중...' : tab === 'login' ? '로그인' : '회원가입'}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: C.grayBorder }}/><span style={{ fontSize: 12, color: C.gray }}>또는</span><div style={{ flex: 1, height: 1, background: C.grayBorder }}/>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[['🟡','카카오'],['🟢','네이버'],['⚫','애플']].map(([icon, name]) => (
          <button key={name} onClick={() => { const u=`${name}_${Math.random().toString(36).slice(2,7)}`; signup(u,'social'); login(u,'social'); router.push('/') }}
            style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, background: C.white, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: C.navy }}>
            {icon} {name}
          </button>
        ))}
      </div>
    </div>
  )

  if (isMobile) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <img src="/logo.png" alt="futuring" style={{ height: 40, objectFit: "contain" }} />
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
        <div style={{ position: 'absolute', top: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>
        <div style={{ marginBottom: 40 }}><img src="/logo.png" alt="futuring" style={{ height: 48, objectFit: "contain", filter: "brightness(0) invert(1)", marginBottom: 40 }} /></div>
        <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.4, marginBottom: 16, letterSpacing: '-0.02em' }}>미래를 함께<br/>예측하세요</p>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.8, maxWidth: 320 }}>커뮤니티와 함께 이슈를 예측하고<br/>포인트로 수익을 만들어보세요.</p>
        <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
          {[['10K+','참여자'],['500+','마켓'],['98%','만족도']].map(([v,l]) => (
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
