'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import { C } from '@/lib/constants'

// AI 유동성 자동 계산
function calcAILiquidity(topic: string, cat: string, days: number): number {
  const base = 5_000
  const catMul: Record<string,number> = { '크립토':2.5, '테크 / AI':2.0, '거시경제':1.8, '주식':1.5, '스포츠':1.2, '테크':1.3 }
  const m = catMul[cat] ?? 1.0
  const dayMul = Math.sqrt(days / 7)
  const topicLen = Math.min(topic.length / 20, 2)
  return Math.round(base * m * dayMul * (1 + topicLen * 0.2) / 1000) * 1000
}

export default function CreatePage() {
  const router = useRouter()
  const { createDebate, walletBalance, currentUser } = usePledgeStore()
  const device = useDevice(); const isMobile = device === 'mobile'
  const [step, setStep] = useState(1)
  const [topic, setTopic] = useState('')
  const [desc, setDesc] = useState('')
  const [sideA, setSideA] = useState('')
  const [sideB, setSideB] = useState('')
  const [cat, setCat] = useState('')
  const [days, setDays] = useState(7)
  const Nav = isMobile ? FuturingNav : PCNav

  // 관리자만 접근 가능
  if (!currentUser.isAdmin) {
    return (
      <div style={{ minHeight:'100vh', background:C.bg }}>
        <Nav/>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 64px)', gap:16 }}>
          <p style={{ fontSize:24 }}>🔒</p>
          <p style={{ fontSize:16, fontWeight:700, color:C.navy }}>관리자만 마켓을 생성할 수 있어요</p>
          <button onClick={()=>router.push('/')} style={{ padding:'10px 24px', borderRadius:12, background:C.blue, color:C.white, border:'none', cursor:'pointer', fontSize:14, fontWeight:700 }}>홈으로</button>
        </div>
        {isMobile&&<BottomNav/>}
      </div>
    )
  }

  const aiLiquidity = topic && cat ? calcAILiquidity(topic, cat, days) : 0
  const CATS = ['거시경제','크립토','테크 / AI','테크','주식','스포츠','기타']

  const handleCreate = () => {
    if (!topic.trim() || !cat) return
    const pledge = Math.min(aiLiquidity, walletBalance)
    createDebate(topic, desc, sideA||'YES', sideB||'NO', cat, pledge, days)
    router.push('/')
  }

  const inner = (
    <div style={{ maxWidth:600, margin:'0 auto' }}>
      {!isMobile&&<h1 style={{ fontSize:24, fontWeight:800, color:C.navy, marginBottom:24 }}>마켓 생성 (관리자)</h1>}

      {step===1&&(
        <div style={{ background:C.white, borderRadius:20, padding:28, border:`1px solid ${C.grayBorder}` }}>
          <p style={{ fontSize:18, fontWeight:800, color:C.navy, marginBottom:6 }}>마켓 주제</p>
          <p style={{ fontSize:13, color:C.gray, marginBottom:20 }}>예측 마켓의 핵심 질문을 입력하세요</p>
          <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="예) 비트코인 2027년 전 2억원 돌파할까?" rows={3}
            style={{ width:'100%', padding:'14px 16px', borderRadius:14, border:`1.5px solid ${C.grayBorder}`, fontSize:15, resize:'none', outline:'none', boxSizing:'border-box' as const, marginBottom:14 }}/>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="설명 (선택)" rows={2}
            style={{ width:'100%', padding:'14px 16px', borderRadius:14, border:`1.5px solid ${C.grayBorder}`, fontSize:14, resize:'none', outline:'none', boxSizing:'border-box' as const, marginBottom:20 }}/>
          <button onClick={()=>topic.trim()&&setStep(2)} disabled={!topic.trim()}
            style={{ width:'100%', padding:'14px 0', borderRadius:14, background:topic.trim()?C.blue:C.grayLight, color:topic.trim()?C.white:C.gray, border:'none', cursor:topic.trim()?'pointer':'not-allowed', fontSize:15, fontWeight:800 }}>
            다음 →
          </button>
        </div>
      )}

      {step===2&&(
        <div style={{ background:C.white, borderRadius:20, padding:28, border:`1px solid ${C.grayBorder}` }}>
          <p style={{ fontSize:18, fontWeight:800, color:C.navy, marginBottom:20 }}>선택지 & 설정</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
            <input value={sideA} onChange={e=>setSideA(e.target.value)} placeholder="YES 선택지 (기본: YES)"
              style={{ padding:'12px 14px', borderRadius:12, border:`1.5px solid ${C.grayBorder}`, fontSize:14, outline:'none' }}/>
            <input value={sideB} onChange={e=>setSideB(e.target.value)} placeholder="NO 선택지 (기본: NO)"
              style={{ padding:'12px 14px', borderRadius:12, border:`1.5px solid ${C.grayBorder}`, fontSize:14, outline:'none' }}/>
          </div>
          <p style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:8 }}>카테고리</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const, marginBottom:20 }}>
            {CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{ padding:'8px 14px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, background:cat===c?C.blue:C.grayLight, color:cat===c?C.white:C.gray }}>{c}</button>)}
          </div>
          <p style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:8 }}>마감 기간</p>
          <div style={{ display:'flex', gap:6, marginBottom:24 }}>
            {[3,7,14,30,60].map(d=><button key={d} onClick={()=>setDays(d)} style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, background:days===d?C.blue:C.grayLight, color:days===d?C.white:C.gray }}>{d}일</button>)}
          </div>

          {/* AI 유동성 */}
          {topic && cat && (
            <div style={{ background:'linear-gradient(135deg,#EFF6FF,#F0F9FF)', borderRadius:14, padding:16, marginBottom:20, border:`1px solid ${C.blueMid2}` }}>
              <p style={{ fontSize:12, color:C.blue, fontWeight:700, marginBottom:4 }}>🤖 AI 추천 초기 유동성</p>
              <p style={{ fontSize:22, fontWeight:900, color:C.navy }}>{aiLiquidity.toLocaleString()} P</p>
              <p style={{ fontSize:12, color:C.gray, marginTop:4 }}>카테고리·기간·주제 복잡도를 분석해 자동 산정됩니다</p>
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setStep(1)} style={{ flex:1, padding:'14px 0', borderRadius:14, background:C.grayLight, color:C.gray, border:'none', cursor:'pointer', fontSize:15, fontWeight:800 }}>← 이전</button>
            <button onClick={handleCreate} disabled={!cat||aiLiquidity>walletBalance}
              style={{ flex:2, padding:'14px 0', borderRadius:14, background:cat&&aiLiquidity<=walletBalance?C.blue:C.grayLight, color:cat&&aiLiquidity<=walletBalance?C.white:C.gray, border:'none', cursor:cat&&aiLiquidity<=walletBalance?'pointer':'not-allowed', fontSize:15, fontWeight:800 }}>
              {aiLiquidity>walletBalance?`잔액 부족 (${(aiLiquidity-walletBalance).toLocaleString()}P 필요)`:'마켓 생성 🚀'}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Nav/>
      <div style={isMobile?{padding:'20px 16px 100px'}:{padding:'40px 40px 60px'}}>{inner}</div>
      {isMobile&&<BottomNav/>}
    </div>
  )
}
