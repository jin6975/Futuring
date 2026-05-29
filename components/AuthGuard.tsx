'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isLoggedIn = usePledgeStore(s => s.currentUser.isLoggedIn)

  // zustand persist는 클라이언트 hydration 후에 localStorage 값을 복원함
  // hydration 전에는 isLoggedIn이 false(초기값)이므로 이를 구분해야 함
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // persist store가 hydration 완료되면 true
    const unsub = usePledgeStore.persist.onFinishHydration(() => setHydrated(true))
    // 이미 hydration 완료된 경우 (빠른 재렌더)
    if (usePledgeStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!isLoggedIn && pathname !== '/login') router.replace('/login')
  }, [hydrated, isLoggedIn, pathname, router])

  // hydration 전: 로그인 페이지면 그냥 보여주고, 나머지는 빈 화면 (깜빡임 방지)
  if (!hydrated) {
    if (pathname === '/login') return <>{children}</>
    return null
  }

  // hydration 완료 후: 미로그인이면 null (useEffect에서 redirect 처리)
  if (!isLoggedIn && pathname !== '/login') return null

  return <>{children}</>
}
