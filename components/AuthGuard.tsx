'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { supabase } from '@/lib/supabase'

// 비로그인도 접근 가능한 경로
const isPublicPath = (pathname: string) =>
  pathname === '/' ||
  pathname === '/login' ||
  pathname === '/tiers' ||
  pathname === '/explore' ||
  pathname.startsWith('/market/')

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoggedIn = usePledgeStore(s => s.currentUser.isLoggedIn)
  const loadMarkets = usePledgeStore(s => s.loadMarkets)
  const loadUserData = usePledgeStore(s => s.loadUserData)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const unsub = usePledgeStore.persist.onFinishHydration(() => setHydrated(true))
    if (usePledgeStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  // 마켓 데이터 로드
  useEffect(() => { loadMarkets() }, [loadMarkets])

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

  // 비공개 경로 + 비로그인 → 로그인 페이지로
  useEffect(() => {
    if (!hydrated) return
    if (!isLoggedIn && !isPublicPath(pathname)) {
      router.replace('/login')
    }
  }, [hydrated, isLoggedIn, pathname, router])

  if (!hydrated) {
    if (isPublicPath(pathname)) return <>{children}</>
    return null
  }

  if (!isLoggedIn && !isPublicPath(pathname)) return null

  return <>{children}</>
}
