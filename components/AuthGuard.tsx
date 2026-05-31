'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { supabase } from '@/lib/supabase'

// 비로그인도 접근 가능한 경로
const PUBLIC_PATHS = ['/', '/market', '/explore', '/tiers', '/login']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoggedIn = usePledgeStore(s => s.currentUser.isLoggedIn)
  const loadMarkets = usePledgeStore(s => s.loadMarkets)
  const loadUserData = usePledgeStore(s => s.loadUserData)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const unsub = usePledgeStore.persist.onFinishHydration(() => setHydrated(true))
    if (usePledgeStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  // 마켓 데이터 로드 (항상)
  useEffect(() => {
    loadMarkets()
  }, [loadMarkets])

  // Supabase 세션 복원
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const store = usePledgeStore.getState()
        if (!store.currentUser.isLoggedIn) {
          supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data: profile }) => {
            if (profile) {
              usePledgeStore.setState({
                currentUser: {
                  isLoggedIn: true,
                  username: profile.username,
                  winRate: profile.win_rate ?? 0,
                  totalPnL: profile.total_pnl ?? 0,
                  isAdmin: profile.is_admin ?? false,
                  userId: session.user.id,
                },
                walletBalance: profile.wallet_balance ?? 5000,
              })
              loadUserData(session.user.id)
            }
          })
        }
      }
    })
  }, [loadUserData])

  if (!hydrated) {
    const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith('/market/'))
    if (isPublic || pathname === '/login') return <>{children}</>
    return null
  }

  // 비공개 경로이고 비로그인이면 로그인 페이지로
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith('/market/'))
  if (!isLoggedIn && !isPublic) {
    if (typeof window !== 'undefined') window.location.href = '/login'
    return null
  }

  return <>{children}</>
}
