'use client'
import { useState, useEffect } from 'react'
import { C } from '@/lib/constants'

const GOLD = '#F59E0B'; const GOLD_MID = '#D97706'; const GOLD_PALE = '#FFFBEB'

export interface AuctionItem {
  id: string; title: string; desc: string
  endAt: number; topBid: number; topBidder: string; minInc: number
}

function Countdown({ endAt }: { endAt: number }) {
  const [r, setR] = useState(endAt - Date.now())
  useEffect(() => { const id = setInterval(() => setR(endAt - Date.now()), 1000); return () => clearInterval(id) }, [endAt])
  const s = Math.max(0, Math.floor(r / 1000))
  return <span style={{ fontSize:12, fontWeight:700, color:C.red }}>⏱ {String(Math.floor(s/3600)).padStart(2,'0')}:{String(Math.floor((s%3600)/60)).padStart(2,'0')}:{String(s%60).padStart(2,'0')}</span>
}

function Avatar({ name, size=32 }: { name: string; size?: number }) {
  const colors = ['#7C3AED','#0891B2','#D97706','#10B981','#DC2626','#2563EB']
  const bg = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:size*0.4, fontWeight:800, flexShrink:0 }}>
      {name[0]?.toUpperCase()}
    </div>
  )
}

export default function AuctionCard({ item, balance, currentBid, currentBidder, onBid }: {
  item: AuctionItem; balance: number; currentBid: number; currentBidder?: string
  onBid: (id: string, amt: number) => void
}) {
  const [inputVal, setInputVal] = useState('')
  const minNext = currentBid + item.minInc
  const bidAmt = Number(inputVal) || 0
  const canBid = bidAmt > currentBid && balance >= bidAmt

  const bidder = currentBidder || item.topBidder

  return (
    <div style={{ background:C.white, borderRadius:20, border:`1.5px solid ${C.grayBorder}`, padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <p style={{ fontSize:16, fontWeight:800, color:C.navy }}>{item.title}</p>
        <Countdown endAt={item.endAt} />
      </div>
      <p style={{ fontSize:13, color:C.gray, marginBottom:14 }}>{item.desc}</p>

      {/* 현재 최고 입찰 + 아바타 */}
      <div style={{ background:GOLD_PALE, borderRadius:14, padding:'12px 16px', marginBottom:14, border:`1px solid #FDE68A`, display:'flex', alignItems:'center', gap:12 }}>
        <Avatar name={bidder} size={40} />
        <div style={{ flex:1 }}>
          <p style={{ fontSize:11, color:GOLD_MID, fontWeight:600, marginBottom:2 }}>현재 최고 입찰자</p>
          <p style={{ fontSize:15, fontWeight:800, color:C.navy }}>@{bidder}</p>
        </div>
        <div style={{ textAlign:'right' as const }}>
          <p style={{ fontSize:11, color:GOLD_MID, fontWeight:600 }}>입찰가</p>
          <p style={{ fontSize:20, fontWeight:900, color:GOLD_MID }}>{currentBid.toLocaleString()}P</p>
        </div>
      </div>

      {/* 직접 입력 */}
      <p style={{ fontSize:12, color:C.gray, marginBottom:6 }}>최소 입찰가: <strong style={{ color:C.navy }}>{minNext.toLocaleString()}P</strong> 이상</p>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <input
          type="number"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder={`${minNext.toLocaleString()} 이상 입력`}
          style={{ flex:1, padding:'11px 14px', borderRadius:12, border:`1.5px solid ${canBid ? GOLD_MID : C.grayBorder}`, fontSize:14, color:C.navy, background:C.white, outline:'none', transition:'border-color 0.15s' }}
        />
      </div>
      <p style={{ fontSize:12, color:C.gray, marginBottom:10 }}>
        내 잔액: <strong style={{ color: balance >= bidAmt ? C.navy : C.red }}>{balance.toLocaleString()}P</strong>
        {bidAmt > balance && <span style={{ color:C.red }}> · 잔액 부족</span>}
        {bidAmt > 0 && bidAmt <= currentBid && <span style={{ color:C.red }}> · 현재 입찰가보다 높아야 해요</span>}
      </p>
      <button
        onClick={() => canBid && onBid(item.id, bidAmt)}
        disabled={!canBid}
        style={{ width:'100%', padding:'13px 0', borderRadius:12, background:canBid?`linear-gradient(135deg,${GOLD_MID},${GOLD})`:C.grayLight, border:'none', cursor:canBid?'pointer':'not-allowed', color:canBid?'#fff':C.gray, fontSize:14, fontWeight:800, boxShadow:canBid?'0 4px 14px rgba(217,119,6,0.3)':'none' }}>
        {canBid ? `${bidAmt.toLocaleString()}P 입찰하기` : '금액을 입력해주세요'}
      </button>
    </div>
  )
}
