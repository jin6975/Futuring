'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { C } from '@/lib/constants'
import { TierBadge } from '@/components/TierBadge'

const NAV_ITEMS = [
  { href:'/',         label:'홈',      icon:'⚡' },
  { href:'/whale',    label:'고래',    icon:'🐋' },
  { href:'/lp',       label:'LP 예치', icon:'💧' },
  { href:'/shop',     label:'상점',    icon:'🛍' },
  { href:'/profile',  label:'프로필',  icon:'👤' },
]

export default function PCNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { walletBalance, currentUser, logout, addDemoPoints } = usePledgeStore()
  return (
    <header style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${C.grayBorder}`, padding:'0 32px', display:'flex', alignItems:'center', height:64, gap:24 }}>
      <Link href="/"><Image src="/logo.png" alt="futuring" height={42} width={160} style={{ objectFit:'contain', objectPosition:'left' }} priority /></Link>
      <nav style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          const isWhale = item.href === '/whale'
          return (
            <Link key={item.href} href={item.href} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:10, fontSize:13, fontWeight:600, color:active?(isWhale?'#D97706':C.blue):C.gray, background:active?(isWhale?'#FFFBEB':C.bluePale):'transparent', textDecoration:'none', transition:'all 0.15s' }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <TierBadge points={walletBalance} size="sm" />
        <button onClick={() => addDemoPoints(100000)} style={{ padding:'7px 14px', borderRadius:10, background:'#F0FDF4', color:'#16A34A', border:'1.5px solid #86EFAC', cursor:'pointer', fontSize:13, fontWeight:700 }}>+ 충전</button>
        <Link href="/activity" style={{ textDecoration:'none' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:C.bluePale, borderRadius:10, padding:'6px 14px' }}>
            <span style={{ fontSize:13 }}>💎</span>
            <span style={{ fontSize:14, fontWeight:700, color:C.blue }}>{walletBalance.toLocaleString()} P</span>
          </div>
        </Link>
        {currentUser.isAdmin && <Link href="/admin" style={{ textDecoration:'none' }}><div style={{ padding:'6px 12px', borderRadius:10, background:'#FEF3C7', border:'1px solid #F59E0B', fontSize:12, fontWeight:700, color:'#92400E' }}>관리자</div></Link>}
        <Link href="/create" style={{ textDecoration:'none' }}><div style={{ padding:'8px 16px', borderRadius:10, background:C.blue, color:C.white, fontSize:13, fontWeight:700 }}>+ 마켓 만들기</div></Link>
        <button onClick={() => { logout(); router.push('/login') }} style={{ padding:'7px 12px', borderRadius:10, border:`1.5px solid ${C.grayBorder}`, background:'transparent', color:C.gray, fontSize:12, fontWeight:600, cursor:'pointer' }}>로그아웃</button>
      </div>
    </header>
  )
}
