'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { supabase } from '@/lib/supabase'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
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
          // 세션 있지만 스토어에 없으면 프로필 조회
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

  useEffect(() => {
    if (!hydrated) return
    if (!isLoggedIn && pathname !== '/login') router.replace('/login')
  }, [hydrated, isLoggedIn, pathname, router])

  if (!hydrated) {
    if (pathname === '/login') return <>{children}</>
    return null
  }

  if (!isLoggedIn && pathname !== '/login') return null

  return <>{children}</>
}
