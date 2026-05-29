'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { C } from '@/lib/constants'

function fmt(n: number) { if(n>=10000) return `${(n/10000).toFixed(1)}만P`; return `${n.toLocaleString()}P` }

type TabKey = 'overview'|'markets'|'create'|'users'|'economy'
const TAB_LABELS: Record<TabKey, string> = {
  overview:'📊 개요', markets:'📋 마켓 관리', create:'➕ 마켓 생성', users:'👥 포인트 관리', economy:'⚙️ 경제 설정'
}

export default function AdminPage() {
  const router = useRouter()
  const { debates, currentUser, resolveDebate, cancelDebate, resetStore, logout, createDebate, addDemoPoints, walletBalance } = usePledgeStore()
  const [tab, setTab] = useState<TabKey>('overview')
  const [toast, setToast] = useState<string|null>(null)
  const [topic, setTopic] = useState(''); const [desc, setDesc] = useState('')
  const [sideA, setSideA] = useState(''); const [sideB, setSideB] = useState('')
  const [cat, setCat] = useState(''); const [days, setDays] = useState(7); const [pledge, setPledge] = useState(1000)
  const [dailyReward, setDailyReward] = useState(200); const [houseEdge, setHouseEdge] = useState(2)
  const [maxBetPct, setMaxBetPct] = useState(50); const [decayRate, setDecayRate] = useState(1); const [burnRate, setBurnRate] = useState(5)

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null), 2500) }

  if (!currentUser.isAdmin) { router.replace('/'); return null }

  const liveDebates = debates.filter(d=>d.status==='live')
  const resolved = debates.filter(d=>d.status==='resolved')
  const totalPool = debates.reduce((a,d)=>a+d.metrics.totalPool,0)
  const CATS = ['거시경제','크립토','테크 / AI','테크','주식','스포츠','기타']

  const handleCreate = () => {
    if (!topic.trim()) return
    createDebate(topic, desc, sideA||'YES', sideB||'NO', cat||'기타', pledge, days)
    setTopic(''); setDesc(''); setSideA(''); setSideB(''); setCat('')
    showToast('✅ 마켓이 생성됐어요!')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0F172A', color:'#fff' }}>
      {toast && <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', background:'#1D4ED8', color:'#fff', padding:'12px 24px', borderRadius:12, fontSize:14, fontWeight:700, zIndex:999 }}>{toast}</div>}

      <div style={{ padding:'28px 40px 0', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:900 }}>관리자 대시보드</h1>
          <p style={{ color:'rgba(255,255,255,0.4)', marginTop:4, fontSize:14 }}>futuring Admin · @{currentUser.username}</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>router.push('/')} style={{ padding:'10px 18px', borderRadius:10, background:'rgba(255,255,255,0.08)', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>← 홈</button>
          <button onClick={()=>{logout();router.push('/login')}} style={{ padding:'10px 18px', borderRadius:10, background:'rgba(255,255,255,0.08)', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>로그아웃</button>
        </div>
      </div>

      <div style={{ padding:'0 40px', display:'flex', gap:6, marginBottom:28 }}>
        {(Object.keys(TAB_LABELS) as TabKey[]).map(k => (
          <button key={k} onClick={()=>setTab(k)} style={{ padding:'10px 20px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, background:tab===k?'#1D4ED8':'rgba(255,255,255,0.06)', color:tab===k?'#fff':'rgba(255,255,255,0.5)' }}>
            {TAB_LABELS[k]}
          </button>
        ))}
      </div>

      <div style={{ padding:'0 40px 60px' }}>

        {tab==='overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
              {([['전체 마켓',String(debates.length),'#fff'],['진행 중',String(liveDebates.length),'#34D399'],['종료됨',String(resolved.length),'#94A3B8'],['총 풀',fmt(totalPool),'#60A5FA']] as [string,string,string][]).map(([l,v,c])=>(
                <div key={l} style={{ background:'rgba(255,255,255,0.05)', borderRadius:16, padding:'20px 24px', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:8 }}>{l}</p>
                  <p style={{ fontSize:28, fontWeight:900, color:c }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:16, padding:24, border:'1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>최근 마켓</p>
              {[...debates].sort((a,b)=>b.createdAt-a.createdAt).slice(0,5).map(d=>(
                <div key={d.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize:13, color:'#E2E8F0', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginRight:16 }}>{d.topic}</p>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <span style={{ fontSize:12, color:'#60A5FA' }}>{fmt(d.metrics.totalPool)}</span>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:d.status==='live'?'rgba(52,211,153,0.15)':'rgba(148,163,184,0.15)', color:d.status==='live'?'#34D399':'#94A3B8' }}>
                      {d.status==='live'?'진행중':d.status==='resolved'?'종료':'취소'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='markets' && (
          <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize:15, fontWeight:800 }}>전체 마켓 관리 ({debates.length}개)</p>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                <thead>
                  <tr style={{ background:'rgba(255,255,255,0.04)' }}>
                    {['마켓','카테고리','풀','YES%','상태','관리'].map(h=>(
                      <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {debates.map((d,i)=>(
                    <tr key={d.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', background:i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding:'12px 16px', maxWidth:280 }}><p style={{ fontSize:13, fontWeight:600, color:'#E2E8F0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.topic}</p></td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'rgba(255,255,255,0.5)' }}>{d.category}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, fontWeight:700, color:'#60A5FA' }}>{fmt(d.metrics.totalPool)}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'#fff' }}>{Math.round(d.metrics.impliedProbA*100)}%</td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, background:d.status==='live'?'rgba(52,211,153,0.2)':d.status==='resolved'?'rgba(96,165,250,0.2)':'rgba(148,163,184,0.2)', color:d.status==='live'?'#34D399':d.status==='resolved'?'#60A5FA':'#94A3B8' }}>
                          {d.status==='live'?'진행중':d.status==='resolved'?'종료':'취소'}
                        </span>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        {d.status==='live' && (
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={()=>{resolveDebate(d.id,'A');showToast(`✅ YES 승리로 종료`)}} style={{ padding:'5px 10px', borderRadius:7, background:'rgba(52,211,153,0.15)', color:'#34D399', border:'none', cursor:'pointer', fontSize:11, fontWeight:700 }}>YES승</button>
                            <button onClick={()=>{resolveDebate(d.id,'B');showToast(`✅ NO 승리로 종료`)}} style={{ padding:'5px 10px', borderRadius:7, background:'rgba(239,68,68,0.15)', color:'#EF4444', border:'none', cursor:'pointer', fontSize:11, fontWeight:700 }}>NO승</button>
                            <button onClick={()=>{cancelDebate(d.id);showToast('취소 완료')}} style={{ padding:'5px 10px', borderRadius:7, background:'rgba(148,163,184,0.15)', color:'#94A3B8', border:'none', cursor:'pointer', fontSize:11, fontWeight:700 }}>취소</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='create' && (
          <div style={{ maxWidth:600 }}>
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:20, padding:28, border:'1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize:16, fontWeight:800, marginBottom:20 }}>새 마켓 생성</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {([['마켓 주제 *', topic, setTopic, '예) 비트코인 2억원 돌파할까?'],['설명', desc, setDesc, '부가 설명'],['YES 선택지', sideA, setSideA, '예) YES — 돌파'],['NO 선택지', sideB, setSideB, '예) NO — 미달']] as [string,string,(v:string)=>void,string][]).map(([label, val, setter, ph])=>(
                  <div key={label}>
                    <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:6 }}>{label}</label>
                    <input value={val} onChange={e=>setter(e.target.value)} placeholder={ph} style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', color:'#fff', fontSize:14, boxSizing:'border-box' as const, outline:'none' }}/>
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:8 }}>카테고리</label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const }}>
                    {CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{ padding:'7px 14px', borderRadius:9, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background:cat===c?C.blue:'rgba(255,255,255,0.08)', color:cat===c?'#fff':'rgba(255,255,255,0.5)' }}>{c}</button>)}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:8 }}>마감 기간</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {[3,7,14,30,60].map(d=><button key={d} onClick={()=>setDays(d)} style={{ flex:1, padding:'9px 0', borderRadius:9, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background:days===d?C.blue:'rgba(255,255,255,0.08)', color:days===d?'#fff':'rgba(255,255,255,0.5)' }}>{d}일</button>)}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:8 }}>초기 유동성</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {[500,1000,2000,5000].map(p=><button key={p} onClick={()=>setPledge(p)} style={{ flex:1, padding:'9px 0', borderRadius:9, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background:pledge===p?C.blue:'rgba(255,255,255,0.08)', color:pledge===p?'#fff':'rgba(255,255,255,0.5)' }}>{p/1000}K</button>)}
                  </div>
                </div>
                <button onClick={handleCreate} disabled={!topic.trim()} style={{ padding:'14px 0', borderRadius:12, background:topic.trim()?C.blue:'rgba(255,255,255,0.08)', color:topic.trim()?'#fff':'rgba(255,255,255,0.3)', border:'none', cursor:topic.trim()?'pointer':'not-allowed', fontSize:15, fontWeight:800, marginTop:8 }}>
                  🚀 마켓 생성하기
                </button>
              </div>
            </div>
          </div>
        )}

        {tab==='users' && (
          <div style={{ maxWidth:500 }}>
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:20, padding:28, border:'1px solid rgba(255,255,255,0.08)', marginBottom:20 }}>
              <p style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>포인트 관리</p>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:20 }}>현재 잔액: <strong style={{ color:'#60A5FA' }}>{walletBalance.toLocaleString()} P</strong></p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
                {[100000,500000,1000000].map(amt=>(
                  <button key={amt} onClick={()=>{addDemoPoints(amt);showToast(`+${amt.toLocaleString()}P 충전`)}} style={{ padding:'11px 20px', borderRadius:10, background:C.blue, color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>+{fmt(amt)}</button>
                ))}
              </div>
            </div>
            <div style={{ background:'rgba(239,68,68,0.08)', borderRadius:16, padding:'16px 24px', border:'1px solid rgba(239,68,68,0.2)' }}>
              <p style={{ fontSize:13, color:'#EF4444', fontWeight:700, marginBottom:12 }}>⚠️ 위험 구역</p>
              <button onClick={()=>{if(confirm('모든 데이터를 초기화할까요?'))resetStore()}} style={{ padding:'10px 20px', borderRadius:10, background:'#EF4444', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>전체 데이터 초기화</button>
            </div>
          </div>
        )}

        {tab==='economy' && (
          <div style={{ maxWidth:640 }}>
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:20, padding:28, border:'1px solid rgba(255,255,255,0.08)', marginBottom:20 }}>
              <p style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>⚙️ 경제 수치 조정</p>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:24 }}>인플레이션/디플레이션 방지를 위한 세부 조정 패널</p>
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {([
                  ['일일 출석 보상 (P)', '매일 로그인 시 지급', dailyReward, setDailyReward, 0, 10000, 100],
                  ['하우스 엣지 (%)', '베팅 수수료 — 소각 공급 조절', houseEdge, setHouseEdge, 0, 20, 0.5],
                  ['최대 베팅 한도 (잔액 %)', '단일 베팅 최대 비율', maxBetPct, setMaxBetPct, 10, 100, 5],
                  ['고래 보유세 (연 %)', '5만P↑ 비활동 시 차감율', decayRate, setDecayRate, 0, 10, 0.5],
                  ['소각율 (%)', '경매/현상금 낙찰 소각 비율', burnRate, setBurnRate, 0, 30, 1],
                ] as [string,string,number,(v:number)=>void,number,number,number][]).map(([label, desc, val, set, min, max, step])=>(
                  <div key={label}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>{label}</p>
                        <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{desc}</p>
                      </div>
                      <span style={{ fontSize:18, fontWeight:900, color:'#60A5FA' }}>{val}{label.includes('%')?'%':'P'}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={val} onChange={e=>set(Number(e.target.value))} style={{ width:'100%', accentColor:'#2563EB' }}/>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>
                      <span>{min}</span><span>{max}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:16, padding:'16px 20px', border:'1px solid rgba(255,255,255,0.08)', marginBottom:16 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#94A3B8', marginBottom:12 }}>현재 설정 요약</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {([['일일 출석',`${dailyReward}P`],['하우스 엣지',`${houseEdge}%`],['최대 베팅',`${maxBetPct}%`],['보유세',`${decayRate}%/년`],['소각율',`${burnRate}%`]] as [string,string][]).map(([k,v])=>(
                  <div key={k} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>{k}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'#60A5FA' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={()=>showToast('✅ 경제 수치 저장 완료')} style={{ width:'100%', padding:'13px 0', borderRadius:12, background:'#1D4ED8', color:'#fff', border:'none', cursor:'pointer', fontSize:14, fontWeight:700 }}>
              설정 저장
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
