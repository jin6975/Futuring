'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { fetchNotifications, markAsRead, markAllAsRead, type Notification } from '@/lib/notifications'
import { C } from '@/lib/constants'

const TYPE_ICON: Record<string, string> = {
  payout: '🎉', first_bet: '🎯', deadline: '⏰', admin: '📢', resolve: '✅', cancel: '↩️'
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return '방금'
  if (s < 3600) return `${Math.floor(s / 60)}분 전`
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`
  return `${Math.floor(s / 86400)}일 전`
}

export default function NotificationBell() {
  const { currentUser } = usePledgeStore()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.isRead).length

  const load = async () => {
    if (!currentUser.userId) return
    setLoading(true)
    const data = await fetchNotifications(currentUser.userId)
    setNotifs(data)
    setLoading(false)
  }

  useEffect(() => {
    if (currentUser.userId) load()
    // 30초마다 새 알림 폴링
    const id = setInterval(() => { if (currentUser.userId) load() }, 30000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.userId])

  // 바깥 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => { setOpen(o => !o); if (!open) load() }

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      await markAsRead(n.id)
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x))
    }
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  const handleMarkAll = async () => {
    if (!currentUser.userId) return
    await markAllAsRead(currentUser.userId)
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  if (!currentUser.isLoggedIn) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={handleOpen} style={{ position: 'relative', width: 36, height: 36, borderRadius: 10, background: open ? C.bluePale : 'transparent', border: `1px solid ${open ? C.blueMid2 : 'transparent'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        🔔
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 44, right: 0, width: 340, background: C.white, borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.15)', border: `1px solid ${C.grayBorder}`, zIndex: 9999, overflow: 'hidden' }}>
          {/* 헤더 */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.grayBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>알림 {unread > 0 && <span style={{ fontSize: 12, color: C.blue }}>({unread})</span>}</p>
            {unread > 0 && <button onClick={handleMarkAll} style={{ fontSize: 12, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>모두 읽음</button>}
          </div>

          {/* 목록 */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {loading && <p style={{ padding: '20px', textAlign: 'center', color: C.gray, fontSize: 13 }}>불러오는 중...</p>}
            {!loading && notifs.length === 0 && <p style={{ padding: '32px 20px', textAlign: 'center', color: C.gray, fontSize: 13 }}>알림이 없어요</p>}
            {notifs.map(n => (
              <div key={n.id} onClick={() => handleClick(n)}
                style={{ padding: '12px 16px', cursor: 'pointer', background: n.isRead ? 'transparent' : '#EFF6FF', borderBottom: `1px solid ${C.grayBorder}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}
                onMouseEnter={e => e.currentTarget.style.background = C.grayLight}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : '#EFF6FF'}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_ICON[n.type] ?? '🔔'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 2 }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: C.gray, lineHeight: 1.5 }}>{n.body}</p>
                  <p style={{ fontSize: 11, color: C.gray, marginTop: 4, opacity: 0.6 }}>{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue, flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))}
          </div>

          {/* 설정 링크 */}
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.grayBorder}`, textAlign: 'center' }}>
            <button onClick={() => { router.push('/profile?tab=notifications'); setOpen(false) }} style={{ fontSize: 12, color: C.gray, background: 'none', border: 'none', cursor: 'pointer' }}>알림 설정 →</button>
          </div>
        </div>
      )}
    </div>
  )
}
