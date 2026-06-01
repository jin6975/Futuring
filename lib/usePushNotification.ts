'use client'
import { useEffect, useState } from 'react'
import { usePledgeStore } from '@/store/usePledgeStore'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export function usePushNotification() {
  const { currentUser } = usePledgeStore()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Service Worker 등록
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(console.error)
  }, [])

  const subscribe = async () => {
    if (!currentUser.userId) return false
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      if (permission !== 'granted') return false

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.userId, subscription: sub.toJSON() }),
      })

      setSubscribed(true)
      return true
    } catch (e) {
      console.error('[push subscribe error]', e)
      return false
    }
  }

  const unsubscribe = async () => {
    if (!currentUser.userId) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.userId }),
      })
      setSubscribed(false)
    } catch (e) {
      console.error('[push unsubscribe error]', e)
    }
  }

  // 로그인 후 기존 구독 여부 확인
  useEffect(() => {
    if (!currentUser.userId || typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setSubscribed(!!sub)
      })
    })
  }, [currentUser.userId])

  return { permission, subscribed, subscribe, unsubscribe }
}
