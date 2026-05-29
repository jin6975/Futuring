'use client'
import { usePledgeStore } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import { TIERS, getTier } from '@/lib/tiers'
import { C } from '@/lib/constants'

function fmt(n: number) {
  if (n >= 100_000_000_000) return `${(n/100_000_000_000).toFixed(0)}000억P`
  if (n >= 100_000_000) return `${(n/100_000_000).toFixed(0)}억P`
  if (n >= 10_000) return `${(n/10_000).toFixed(0)}만P`
  return `${n.toLocaleString()}P`
}

export default function TiersPage() {
  const walletBalance = usePledgeStore(s => s.walletBalance)
  const device = useDevice(); const isMobile = device === 'mobile'
  const myTier = getTier(walletBalance)
  const Nav = isMobile ? FuturingNav : PCNav
  const normal = TIERS.filter(t=>!t.isWhale)
  const whale = TIERS.filter(t=>t.isWhale)

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Nav/>
      <div style={{ maxWidth:760, margin:'0 auto', padding:isMobile?'20px 16px 100px':'40px 40px 60px' }}>
        <h1 style={{ fontSize:isMobile?22:28, fontWeight:900, color:C.navy, marginBottom:4 }}>티어 시스템</h1>
        <p style={{ fontSize:14, color:C.gray, marginBottom:28 }}>보유 포인트에 따라 티어가 자동 부여됩니다</p>

        {/* 내 티어 */}
        <div style={{ background:`${myTier.color}18`, borderRadius:20, padding:24, border:`2px solid ${myTier.border}`, marginBottom:32 }}>
          <p style={{ fontSize:12, color:myTier.color, fontWeight:700, marginBottom:8 }}>내 현재 티어</p>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <span style={{ fontSize:48 }}>{myTier.emoji}</span>
            <div>
              <p style={{ fontSize:24, fontWeight:900, color:myTier.color }}>{myTier.name}</p>
              <p style={{ fontSize:14, color:C.gray }}>{myTier.description}</p>
              <p style={{ fontSize:13, fontWeight:700, color:C.navy, marginTop:4 }}>{walletBalance.toLocaleString()}P 보유</p>
            </div>
          </div>
        </div>

        {/* 일반 티어 */}
        <p style={{ fontSize:16, fontWeight:800, color:C.navy, marginBottom:12 }}>일반 티어</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:32 }}>
          {normal.map((t,i)=>{
            const next = normal[i+1] ?? whale[0]
            const isMe = myTier.name===t.name
            return (
              <div key={t.name} style={{ background:isMe?`${t.color}10`:C.white, borderRadius:14, padding:'16px 18px', border:`1.5px solid ${isMe?t.color:C.grayBorder}`, display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:30, flexShrink:0 }}>{t.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:isMe?t.color:C.navy }}>{t.name}</span>
                    {isMe&&<span style={{ fontSize:11, fontWeight:700, background:t.color, color:'#fff', padding:'2px 8px', borderRadius:99 }}>현재</span>}
                  </div>
                  <p style={{ fontSize:12, color:C.gray }}>{t.description}</p>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:t.color }}>{fmt(t.minPoints)}~</p>
                  <p style={{ fontSize:11, color:C.gray }}>{next?fmt(next.minPoints):'∞'}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 고래 티어 */}
        <div style={{ background:'linear-gradient(135deg,#1C1917,#292524)', borderRadius:16, padding:'16px 20px', marginBottom:14 }}>
          <p style={{ fontSize:14, fontWeight:800, color:'#F59E0B' }}>🐋 고래 전용 티어 (1억P 이상)</p>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 }}>고래 놀이터 입장 + 전용 배지 + 선전포고 권한</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {whale.map((t,i)=>{
            const next = whale[i+1]
            const isMe = myTier.name===t.name
            return (
              <div key={t.name} style={{ background:isMe?`${t.color}10`:C.white, borderRadius:14, padding:'16px 18px', border:`1.5px solid ${isMe?t.color:C.grayBorder}`, display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:30, flexShrink:0 }}>{t.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:isMe?t.color:C.navy }}>{t.name}</span>
                    {isMe&&<span style={{ fontSize:11, fontWeight:700, background:t.color, color:'#fff', padding:'2px 8px', borderRadius:99 }}>현재</span>}
                  </div>
                  <p style={{ fontSize:12, color:C.gray }}>{t.description}</p>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:t.color }}>{fmt(t.minPoints)}~</p>
                  <p style={{ fontSize:11, color:C.gray }}>{next?fmt(next.minPoints):'∞'}</p>
                  {!next&&<p style={{ fontSize:11, color:'#F59E0B' }}>최고 등급 👑</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {isMobile&&<BottomNav/>}
    </div>
  )
}
