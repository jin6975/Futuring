'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { C } from '@/lib/constants'

interface Props {
  onClose: () => void
  message?: string  // 베팅 시도 메시지
}

export default function LoginModal({ onClose, message }: Props) {
  const { login, signup } = usePledgeStore()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setErr('')
    if (!username.trim() || !password.trim()) { setErr('아이디와 비밀번호를 입력해주세요'); return }
    setLoading(true)
    if (mode === 'login') {
      const ok = await login(username.trim(), password.trim())
      if (ok) { onClose() }
      else { setErr('아이디 또는 비밀번호가 올바르지 않아요') }
    } else {
      if (password.length < 6) { setErr('비밀번호는 6자 이상이어야 해요'); setLoading(false); return }
      if (password !== passwordConfirm) { setErr('비밀번호가 일치하지 않아요'); setLoading(false); return }
      const ok = await signup(username.trim(), password.trim())
      if (ok) {
        await login(username.trim(), password.trim())
        onClose()
      } else setErr('이미 사용 중인 아이디예요')
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: C.white, borderRadius: 24, padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${C.blueMid}, ${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 12px' }}>⚡</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: C.navy, marginBottom: 6 }}>
            {mode === 'login' ? (message ?? '로그인이 필요한 서비스예요') : '회원가입'}
          </h2>
          <p style={{ fontSize: 13, color: C.gray }}>
            {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.blue, fontWeight: 700, fontSize: 13, marginLeft: 4 }}>
              {mode === 'login' ? '회원가입 →' : '로그인 →'}
            </button>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <input value={username} onChange={e => setUsername(e.target.value)}
            placeholder="아이디" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 15, color: C.navy, outline: 'none', background: C.grayLight }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호 (6자 이상)" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 15, color: C.navy, outline: 'none', background: C.grayLight }} />
          {mode === 'signup' && (
            <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 확인" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, fontSize: 15, color: C.navy, outline: 'none', background: C.grayLight }} />
          )}
        </div>

        {err && (
          <div style={{ background: C.redPale, border: `1px solid #FECACA`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: C.red, fontWeight: 600, textAlign: 'center' as const }}>
            {err}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: loading ? C.grayLight : `linear-gradient(135deg, ${C.blueMid}, ${C.blue})`, color: loading ? C.gray : '#fff', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(29,78,216,0.3)', marginBottom: 12 }}>
          {loading ? '처리중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>

        <button onClick={() => { onClose(); router.push('/login') }}
          style={{ width: '100%', padding: '12px 0', borderRadius: 14, border: `1.5px solid ${C.grayBorder}`, background: C.white, color: C.gray, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          로그인 페이지로 이동
        </button>
      </div>
    </div>
  )
}
