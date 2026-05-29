'use client'
import { useState, useEffect } from 'react'
import { usePledgeStore } from '@/store/usePledgeStore'
import { SHOP_ITEMS, CATEGORY_LABELS, type ShopCategory } from '@/lib/shopItems'
import { useDevice } from '@/lib/useDevice'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import { C } from '@/lib/constants'
const BLUE='#2563EB', ORANGE='#D97706'
const DAY_MS=86400000
function useNow(){const[n,setN]=useState(0);useEffect(()=>{setN(Date.now());const t=setInterval(()=>setN(Date.now()),60000);return()=>clearInterval(t)},[]);return n}
function fmtCountdown(ms:number){if(ms<=0)return'만료됨';const d=Math.floor(ms/DAY_MS);const h=Math.floor((ms%DAY_MS)/3600000);if(d>0)return`${d}일 ${h}시간 남음`;return`${h}시간 남음`}
export default function ShopPage() {
  const { walletBalance, customization, purchaseItem, equipItem, unequipCategory, addDemoPoints } = usePledgeStore()
  const device = useDevice(); const isMobile = device==='mobile'
  const [catFilter, setCatFilter] = useState<ShopCategory|'all'>('all')
  const [chargeTab, setChargeTab] = useState(false)
  const now = useNow()
  const Nav = isMobile?FuturingNav:PCNav
  const items = catFilter==='all'?SHOP_ITEMS:SHOP_ITEMS.filter(i=>i.category===catFilter)
  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Nav/>
      <div style={isMobile?{padding:'20px 16px 100px'}:{maxWidth:1000,margin:'0 auto',padding:'40px 40px 60px'}}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <h1 style={{ fontSize:isMobile?22:26, fontWeight:800, color:C.navy }}>아이템 상점</h1>
          <div style={{ background:C.bluePale, borderRadius:10, padding:'6px 14px', fontSize:14, fontWeight:700, color:C.blue }}>💎 {walletBalance.toLocaleString()} P</div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' as const }}>
          <button onClick={()=>setChargeTab(!chargeTab)} style={{ padding:'8px 16px', borderRadius:99, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, background:chargeTab?'#7C3AED':'#F5F3FF', color:chargeTab?'#fff':'#7C3AED', boxShadow:chargeTab?'0 2px 10px rgba(124,58,237,0.3)':'0 0 0 1.5px #C4B5FD' }}>💳 포인트 충전</button>
          {(['all','frame','badge','theme'] as const).map(c=><button key={c} onClick={()=>setCatFilter(c)} style={{ padding:'8px 16px', borderRadius:99, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, background:catFilter===c?C.blue:C.white, color:catFilter===c?C.white:C.gray, boxShadow:catFilter===c?'0 2px 10px rgba(29,78,216,0.25)':`0 0 0 1.5px ${C.grayBorder}` }}>{c==='all'?'전체':CATEGORY_LABELS[c]}</button>)}
        </div>
        {chargeTab && (
          <div style={{ background:'linear-gradient(135deg,#4F46E5,#7C3AED)', borderRadius:20, padding:28, marginBottom:24 }}>
            <p style={{ fontSize:18, fontWeight:900, color:'#fff', marginBottom:4 }}>💳 포인트 충전</p>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:24 }}>실제 결제 연동 전 테스트 충전입니다</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
              {[
                { label:'스타터팩', pts:10_000, price:'₩10,000', badge:'입문' },
                { label:'베이직팩', pts:50_000, price:'₩50,000', badge:'BEST' },
                { label:'프리미엄팩', pts:100_000, price:'₩100,000', badge:'인기' },
                { label:'엘리트팩', pts:500_000, price:'₩500,000', badge:'' },
                { label:'마스터팩', pts:1_000_000, price:'₩1,000,000', badge:'고래' },
                { label:'웨일팩', pts:10_000_000, price:'₩10,000,000', badge:'🐋' },
              ].map(({ label, pts, price, badge }) => (
                <button key={label} onClick={() => { addDemoPoints(pts); setChargeTab(false) }}
                  style={{ background:'rgba(255,255,255,0.12)', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:16, padding:'16px 14px', cursor:'pointer', textAlign:'left' as const, position:'relative' as const }}>
                  {badge && <span style={{ position:'absolute', top:8, right:8, fontSize:10, fontWeight:700, background:'#F59E0B', color:'#fff', padding:'2px 6px', borderRadius:99 }}>{badge}</span>}
                  <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:4 }}>{label}</p>
                  <p style={{ fontSize:18, fontWeight:900, color:'#fff' }}>{pts>=10000?`${(pts/10000).toFixed(0)}만P`:`${pts.toLocaleString()}P`}</p>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:4 }}>{price}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:16 }}>
          {items.map(item=>{
            const owned=customization.ownedItemIds.includes(item.id)
            const expiry=customization.ownedItemExpiry[item.id]
            const expired=owned&&!!expiry&&expiry<now
            const timeLeft=owned&&expiry?Math.max(0,expiry-now):0
            const equipped=customization.equippedFrame===item.id||customization.equippedBadge===item.id||customization.equippedTheme===item.id
            const canAfford=walletBalance>=item.price
            return(
              <div key={item.id} style={{ background:C.white, borderRadius:20, overflow:'hidden', border:equipped?`2px solid ${BLUE}`:`1px solid ${C.grayBorder}`, boxShadow:equipped?`0 0 0 3px ${C.bluePale}`:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ height:80, background:'#F9FAFB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, position:'relative' }}>
                  {item.category==='frame'&&<div style={{ width:48, height:48, borderRadius:'50%', background:BLUE, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, boxShadow:`0 0 0 4px ${item.preview.bg}` }}>U</div>}
                  {item.category==='badge'&&<div style={{ background:C.bluePale, color:BLUE, padding:'4px 12px', borderRadius:99, fontSize:13, fontWeight:700 }}>{item.preview.emoji} {item.preview.text}</div>}
                  {item.category==='theme'&&<div style={{ width:'100%', height:'100%', background:item.preview.bg }}/>}
                  {equipped&&<span style={{ position:'absolute', top:6, right:6, fontSize:10, fontWeight:700, background:BLUE, color:'#fff', padding:'2px 6px', borderRadius:99 }}>장착</span>}
                </div>
                <div style={{ padding:14 }}>
                  <p style={{ fontSize:13, fontWeight:800, color:C.navy, marginBottom:2 }}>{item.name}</p>
                  <p style={{ fontSize:11, color:C.gray, marginBottom:owned&&timeLeft>0?4:8 }}>{item.description}</p>
                  {owned&&timeLeft>0&&<p style={{ fontSize:11, color:ORANGE, marginBottom:8, fontWeight:600 }}>⏳ {fmtCountdown(timeLeft)}</p>}
                  {!owned&&!expired
                    ?<button onClick={()=>canAfford&&purchaseItem(item.id)} disabled={!canAfford} style={{ width:'100%', padding:'9px 0', borderRadius:10, background:canAfford?C.blue:C.grayLight, color:canAfford?C.white:C.gray, border:'none', cursor:canAfford?'pointer':'not-allowed', fontSize:12, fontWeight:700 }}>{item.price.toLocaleString()} P {item.durationDays?`(${item.durationDays}일)`:''}</button>
                    :equipped
                      ?<button onClick={()=>unequipCategory(item.category)} style={{ width:'100%', padding:'9px 0', borderRadius:10, background:C.grayLight, color:C.gray, border:'none', cursor:'pointer', fontSize:12, fontWeight:700 }}>해제</button>
                      :<button onClick={()=>!expired&&equipItem(item.id)} disabled={expired} style={{ width:'100%', padding:'9px 0', borderRadius:10, background:expired?C.redPale:C.bluePale, color:expired?C.red:C.blue, border:'none', cursor:expired?'not-allowed':'pointer', fontSize:12, fontWeight:700 }}>{expired?'만료됨':'장착하기'}</button>}
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
