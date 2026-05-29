'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { C } from '@/lib/constants'

const TABS = [
  { id:'home',    href:'/',        icon:'⚡', label:'홈' },
  { id:'whale',   href:'/whale',   icon:'🐋', label:'고래' },
  { id:'create',  href:'/create',  icon:'＋', label:'',   special:true },
  { id:'lp',      href:'/lp',      icon:'💧', label:'LP' },
  { id:'profile', href:'/profile', icon:'👤', label:'프로필' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:C.white, borderTop:`1px solid ${C.grayBorder}`, display:'flex', justifyContent:'space-around', alignItems:'center', padding:'8px 0 20px', zIndex:50 }}>
      {TABS.map(t=>{
        const active = pathname===t.href
        return (
          <Link key={t.id} href={t.href} style={{ textDecoration:'none' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'4px 10px' }}>
              {t.special
                ? <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${C.blueMid},${C.blue})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:C.white, marginTop:-16, boxShadow:'0 4px 14px rgba(29,78,216,0.35)' }}>＋</div>
                : <>
                    <span style={{ fontSize:20 }}>{t.icon}</span>
                    <span style={{ fontSize:10, fontWeight:active?700:500, color:active?C.blue:C.gray }}>{t.label}</span>
                  </>
              }
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
