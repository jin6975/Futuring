'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { C } from '@/lib/constants'

interface Props { onClose: () => void }

export default function LoginModal({ onClose }: Props) {
  const { login, signup } = usePledgeStore()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const handleSubmit = () => {
    setErr('')
    if (!username.trim() || !password.trim()) { setErr('아이디와 비밀번호를 입력해주세요'); return }
    if (mode === 'login') {
      const ok = login(username.trim(), password.trim())
      if (ok) { onClose() }
      else setErr('아이디 또는 비밀번호가 올바르지 않아요')
    } else {
      const ok = signup(username.trim(), password.trim())
      if (ok) {
        login(username.trim(), password.trim())
        onClose()
      } else setErr('이미 사용 중인 아이디예요')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: C.white, borderRadius: 24, padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        {/* 로고 + 헤더 */}
        <div style={{ textAlign: 'center' as const, marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${C.blueMid}, ${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 12px' }}>⚡</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: C.navy, marginBottom: 6 }}>
            {mode === 'login' ? '베팅하려면 로그인하세요' : '회원가입'}
          </h2>
          <p style={{ fontSize: 13, color: C.gray }}>
            {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.blue, fontWeight: 700, fontSize: 13, marginLeft: 4 }}>
              {mode === 'login' ? '회원가입 →' : '로그인 →'}
            </button>
          </p>
        </div>

        {/* 입력 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <input value={username} onChange={e => setUsername(e.target.value)}
            placeholder="아이디" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 15, color: C.navy, outline: 'none', background: C.grayLight }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 15, color: C.navy, outline: 'none', background: C.grayLight }} />
        </div>

        {err && <p style={{ fontSize: 13, color: C.red, marginBottom: 12, textAlign: 'center' as const }}>{err}</p>}

        <button onClick={handleSubmit}
          style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${C.blueMid}, ${C.blue})`, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(29,78,216,0.3)', marginBottom: 12 }}>
          {mode === 'login' ? '로그인' : '회원가입'}
        </button>

        <button onClick={onClose}
          style={{ width: '100%', padding: '12px 0', borderRadius: 14, border: `1.5px solid ${C.grayBorder}`, background: C.white, color: C.gray, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          닫기
        </button>
      </div>
    </div>
  )
}
