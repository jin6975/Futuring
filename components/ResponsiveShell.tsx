'use client'
import PCNav from './PCNav'
import BottomNav from './BottomNav'
import { useDevice } from '@/lib/useDevice'
import { C } from '@/lib/constants'
export default function ResponsiveShell({ children, pcMaxWidth = 1200 }: { children: React.ReactNode; pcMaxWidth?: number }) {
  const device = useDevice()
  const isMobile = device === 'mobile'
  if (isMobile) return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:90 }}>
      {children}
      <BottomNav />
    </div>
  )
  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <PCNav />
      <div style={{ maxWidth:pcMaxWidth, margin:'0 auto', padding:'40px 40px 60px' }}>
        {children}
      </div>
    </div>
  )
}
