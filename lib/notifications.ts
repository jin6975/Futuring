import { supabase } from '@/lib/supabase'

export type NotifType = 'payout' | 'first_bet' | 'deadline' | 'admin' | 'resolve' | 'cancel'

export interface Notification {
  id: string
  userId: string
  type: NotifType
  title: string
  body: string
  link?: string
  isRead: boolean
  createdAt: number
}

const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

// 알림 생성 (단일 유저)
export async function createNotification(
  userId: string,
  type: NotifType,
  title: string,
  body: string,
  link?: string
) {
  // 알림 설정 확인
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // 설정이 있고 해당 타입이 꺼져있으면 발송 안 함
  if (settings) {
    if (type === 'payout' && !settings.payout_alert) return
    if (type === 'resolve' && !settings.payout_alert) return
    if (type === 'cancel' && !settings.payout_alert) return
    if (type === 'deadline' && !settings.deadline_alert) return
    if (type === 'first_bet' && !settings.first_bet_alert) return
    if (type === 'admin' && !settings.admin_alert) return
  }

  await supabase.from('notifications').insert({
    id: generateId(),
    user_id: userId,
    type,
    title,
    body,
    link: link ?? null,
    is_read: false,
  })

  // 브라우저 푸시 알림 발송 (서버사이드에서 호출 시)
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://futuring-three.vercel.app'
    await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body, link }),
    })
  } catch {
    // 구독 정보 없으면 무시
  }
}

// 전체 유저에게 알림 (관리자 공지)
export async function createAdminBroadcast(title: string, body: string, link?: string) {
  const { data: profiles } = await supabase.from('profiles').select('id')
  if (!profiles) return

  const rows = profiles.map((p: { id: string }) => ({
    id: generateId(),
    user_id: p.id,
    type: 'admin',
    title,
    body,
    link: link ?? null,
    is_read: false,
  }))

  // 100개씩 나눠서 insert
  for (let i = 0; i < rows.length; i += 100) {
    await supabase.from('notifications').insert(rows.slice(i, i + 100))
  }

  // 각 유저에게 푸시 발송 (너무 많으면 백그라운드에서 처리)
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://futuring-three.vercel.app'
    await Promise.allSettled(
      profiles.map((p: { id: string }) =>
        fetch(`${baseUrl}/api/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: p.id, title, body, link }),
        })
      )
    )
  } catch {
    // 무시
  }
}

// 알림 목록 조회
export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data) return []
  return data.map((r: {
    id: string; user_id: string; type: string; title: string;
    body: string; link: string | null; is_read: boolean; created_at: string
  }) => ({
    id: r.id, userId: r.user_id, type: r.type as NotifType,
    title: r.title, body: r.body, link: r.link ?? undefined,
    isRead: r.is_read, createdAt: new Date(r.created_at).getTime(),
  }))
}

// 읽음 처리
export async function markAsRead(notifId: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', notifId)
}

// 전체 읽음 처리
export async function markAllAsRead(userId: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
}

// 알림 설정 조회
export async function fetchNotifSettings(userId: string) {
  const { data } = await supabase.from('notification_settings').select('*').eq('user_id', userId).maybeSingle()
  return data ?? { payout_alert: true, deadline_alert: true, first_bet_alert: true, admin_alert: true }
}

// 알림 설정 저장
export async function saveNotifSettings(userId: string, settings: {
  payout_alert: boolean; deadline_alert: boolean; first_bet_alert: boolean; admin_alert: boolean
}) {
  await supabase.from('notification_settings').upsert({ user_id: userId, ...settings })
}
