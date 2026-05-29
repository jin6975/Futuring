'use client'
import { useMemo, useState } from 'react'
import { usePledgeStore, type Debate, type Side } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import FuturingMarketCard from '@/components/FuturingMarketCard'
import BetBottomSheet from '@/components/BetBottomSheet'
import BottomNav from '@/components/BottomNav'
import { C } from '@/lib/constants'
import Link from 'next/link'

function fmtPool(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M P`
  return `${(n/1_000).toFixed(0)}K P`
}

export default function HomePage() {
  const debates = usePledgeStore(s => s.debates)
  const device = useDevice()
  const isMobile = device === 'mobile'
  const [cat, setCat] = useState('전체')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'latest'|'deadline'|'volume'>('latest')
  const [betDebate, setBetDebate] = useState<Debate|null>(null)
  const [betSide, setBetSide] = useState<Side|null>(null)
  const [showAll, setShowAll] = useState(false)

  const categories: string[] = useMemo(() => ['전체', ...Array.from(new Set<string>(debates.map(d => d.category))).sort()], [debates])
  const hotDebate = [...debates].filter(d=>d.status==='live').sort((a,b)=>b.metrics.totalPool-a.metrics.totalPool)[0]

  const filtered = useMemo(() => {
    let list = debates.filter(d=>d.status==='live')
    if (cat !== '전체') list = list.filter(d=>d.category===cat)
    if (search.trim()) list = list.filter(d=>d.topic.toLowerCase().includes(search.toLowerCase()))
    if (sort==='latest')   list.sort((a,b)=>b.createdAt-a.createdAt)
    if (sort==='deadline') list.sort((a,b)=>a.resolvesAt-b.resolvesAt)
    if (sort==='volume')   list.sort((a,b)=>b.metrics.totalPool-a.metrics.totalPool)
    return list
  }, [debates, cat, search, sort])

  const displayed = isMobile && !showAll && !search ? filtered.slice(0, 6) : filtered
  const onBet = (d: Debate, s: Side) => { setBetDebate(d); setBetSide(s) }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:isMobile?90:0 }}>
      {isMobile ? <FuturingNav/> : <PCNav/>}

      <div style={{ maxWidth:isMobile?undefined:1200, margin:'0 auto', padding:isMobile?'16px 16px 0':'40px 40px 60px' }}>

        {/* 고래 배틀 배너 */}
        <div style={{ background:'linear-gradient(135deg,#1C1917 0%,#292524 100%)', borderRadius:16, padding:'14px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:12, border:'1px solid rgba(245,158,11,0.3)' }}>
          <span style={{ fontSize:20 }}>⚔️</span>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>고래 배틀 진행 중</p>
            <p style={{ fontSize:isMobile?13:14, fontWeight:800, color:'#fff' }}>@whale_89 vs @btc_maxi — 수익률 대결 144시간 남음</p>
          </div>
          <a href="/whale" style={{ textDecoration:'none' }}>
            <button style={{ padding:'8px 16px', borderRadius:10, background:'#F59E0B', color:'#fff', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, whiteSpace:'nowrap' as const }}>응원 베팅 →</button>
          </a>
        </div>

        {/* 히어로 */}
        {hotDebate && (
          <div style={{ background:`linear-gradient(135deg,${C.navy} 0%,#1E3A8A 60%,${C.blueMid} 100%)`, borderRadius:isMobile?20:24, padding:isMobile?'22px':'40px 48px', marginBottom:20, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
            <p style={{ fontSize:isMobile?12:13, color:'rgba(255,255,255,0.6)', marginBottom:6 }}>🔥 지금 가장 뜨거운 이슈</p>
            <p style={{ fontSize:isMobile?17:24, fontWeight:900, color:'#fff', lineHeight:1.4, marginBottom:16, maxWidth:600 }}>{hotDebate.topic}</p>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <Link href={`/market/${hotDebate.id}`}><button style={{ padding:isMobile?'10px 20px':'12px 28px', borderRadius:12, background:'#fff', color:C.navy, border:'none', cursor:'pointer', fontSize:isMobile?13:14, fontWeight:800 }}>예측 참여 →</button></Link>
              <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13 }}>💰 {fmtPool(hotDebate.metrics.totalPool)}</span>
            </div>
          </div>
        )}

        {/* 검색바 */}
        <div style={{ position:'relative', marginBottom:16 }}>
          <svg style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke={C.gray} strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke={C.gray} strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e=>{setSearch(e.target.value);setShowAll(true)}} placeholder="마켓 검색..."
            style={{ width:'100%', padding:'12px 40px 12px 42px', border:`1.5px solid ${C.grayBorder}`, borderRadius:14, fontSize:14, outline:'none', color:C.navy, background:C.white, boxSizing:'border-box' as const }}/>
          {search && <button onClick={()=>{setSearch('');setShowAll(false)}} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:C.gray }}>✕</button>}
        </div>

        {/* 필터 */}
        <div style={{ display:'flex', gap:isMobile?8:12, marginBottom:isMobile?16:24, flexWrap:'wrap' as const }}>
          <div style={{ display:'flex', gap:6, overflowX:'auto', flex:1 }}>
            {categories.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{ flexShrink:0, padding:'7px 16px', borderRadius:99, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, background:cat===c?C.blue:C.white, color:cat===c?C.white:C.gray, boxShadow:cat===c?'0 2px 10px rgba(29,78,216,0.25)':`0 0 0 1.5px ${C.grayBorder}` }}>{c}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:4, background:C.grayLight, borderRadius:10, padding:4, flexShrink:0 }}>
            {([['latest','최신'],['deadline','마감임박'],['volume','거래량']] as const).map(([k,l])=>(
              <button key={k} onClick={()=>setSort(k)} style={{ padding:'6px 12px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background:sort===k?C.white:'transparent', color:sort===k?C.navy:C.gray, boxShadow:sort===k?'0 1px 4px rgba(0,0,0,0.08)':'none' }}>{l}</button>
            ))}
          </div>
        </div>

        {/* 카드 그리드 */}
        <div style={isMobile?{display:'flex',flexDirection:'column',gap:12}:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
          {filtered.length===0
            ? <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'80px 0' }}><p style={{ fontSize:40, marginBottom:12 }}>🔍</p><p style={{ fontSize:16, fontWeight:700, color:C.navy }}>마켓이 없어요</p></div>
            : displayed.map(d=><FuturingMarketCard key={d.id} debate={d} onBet={onBet}/>)
          }
        </div>

        {/* 더보기 */}
        {isMobile && !showAll && !search && filtered.length > 6 && (
          <button onClick={()=>setShowAll(true)} style={{ width:'100%', marginTop:16, padding:'13px 0', borderRadius:14, border:`1.5px solid ${C.grayBorder}`, background:C.white, color:C.gray, fontSize:14, fontWeight:700, cursor:'pointer' }}>
            더보기 ({filtered.length-6}개 남음) ↓
          </button>
        )}
      </div>

      {isMobile && <BottomNav/>}
      <BetBottomSheet debate={betDebate} side={betSide} onClose={()=>{setBetDebate(null);setBetSide(null)}}/>
    </div>
  )
}
