// Futuring Service Worker - 브라우저 푸시 알림 처리

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// 푸시 알림 수신
self.addEventListener('push', e => {
  if (!e.data) return
  const data = e.data.json()
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo.png',
      badge: '/logo.png',
      data: { link: data.link ?? '/' },
      vibrate: [200, 100, 200],
    })
  )
})

// 알림 클릭 시 해당 페이지로 이동
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const link = e.notification.data?.link ?? '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.navigate(link)
          return
        }
      }
      // 없으면 새 탭 열기
      self.clients.openWindow(link)
    })
  )
})
