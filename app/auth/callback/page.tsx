'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { usePledgeStore } from '@/store/usePledgeStore'
import { C } from '@/lib/constants'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { loadUserData } = usePledgeStore()

  useEffect(() => {
    const handle = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session?.user) { router.replace('/login'); return }

      const user = session.user
      const meta = user.user_metadata

      // username 결정: 카카오는 nickname, 구글은 name, 없으면 이메일 앞부분
      const rawName = meta?.name ?? meta?.full_name ?? meta?.preferred_username ?? user.email?.split('@')[0] ?? 'user'
      const username = rawName.replace(/[^a-zA-Z0-9가-힣_]/g, '').slice(0, 20) || `user_${user.id.slice(0, 6)}`

      // profiles 테이블에 없으면 생성
      const { data: existing } = await supabase.from('profiles').select('id, username, wallet_balance, is_admin').eq('id', user.id).single()

      if (!existing) {
        await supabase.from('profiles').insert({
          id: user.id,
          username,
          is_admin: false,
          wallet_balance: 5000,
        })
      }

      const profile = existing ?? { username, wallet_balance: 5000, is_admin: false }

      // store에 로그인 상태 반영
      usePledgeStore.setState({
        currentUser: {
          isLoggedIn: true,
          username: profile.username,
          winRate: 0,
          totalPnL: 0,
          isAdmin: profile.is_admin ?? false,
          userId: user.id,
        },
        walletBalance: profile.wallet_balance ?? 5000,
      })

      await loadUserData(user.id)
      router.replace(profile.is_admin ? '/admin' : '/')
    }

    handle()
  }, [router, loadUserData])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 40 }}>🔄</div>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>로그인 처리 중...</p>
    </div>
  )
}
