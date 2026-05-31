'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { C } from '@/lib/constants'

export default function FuturingNav() {
  const balance = usePledgeStore(s => s.walletBalance)
  const isAdmin = usePledgeStore(s => s.currentUser.isAdmin)
  const isLoggedIn = usePledgeStore(s => s.currentUser.isLoggedIn)
  const logout = usePledgeStore(s => s.logout)
  const addDemoPoints = usePledgeStore(s => s.addDemoPoints)
  const router = useRouter()

  return (
    <header style={{ position:'sticky', top:0, zIndex:40, background:'rgba(248,250,255,0.96)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${C.grayBorder}`, padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <Link href="/"><Image src="/logo.png" alt="futuring" height={40} width={150} style={{ objectFit:'contain', objectPosition:'left' }} priority /></Link>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {isLoggedIn ? (
          <>
            <button onClick={() => addDemoPoints(100000)} style={{ padding:'6px 12px', borderRadius:9, background:'#F0FDF4', color:'#16A34A', border:'1.5px solid #86EFAC', cursor:'pointer', fontSize:12, fontWeight:700 }}>+ 충전</button>
            <Link href="/activity" style={{ textDecoration:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, background:C.bluePale, borderRadius:9, padding:'5px 10px' }}>
                <span style={{ fontSize:13 }}>💎</span>
                <span style={{ fontSize:13, fontWeight:700, color:C.blue }}>{balance.toLocaleString()} P</span>
              </div>
            </Link>
            {isAdmin && <Link href="/admin" style={{ textDecoration:'none' }}><div style={{ padding:'5px 10px', borderRadius:9, background:'#FEF3C7', border:'1px solid #F59E0B', fontSize:11, fontWeight:700, color:'#92400E' }}>관리자</div></Link>}
          </>
        ) : (
          <Link href="/login" style={{ textDecoration:'none' }}>
            <div style={{ padding:'7px 16px', borderRadius:10, background:C.blue, color:C.white, fontSize:13, fontWeight:700, cursor:'pointer' }}>로그인</div>
          </Link>
        )}
      </div>
    </header>
  )
}
