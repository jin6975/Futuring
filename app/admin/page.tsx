'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePledgeStore, type WhaleBattle, type AuctionItem, type Bounty, type EconomySettings } from '@/store/usePledgeStore'
import { createAdminBroadcast } from '@/lib/notifications'
import { C } from '@/lib/constants'

function fmt(n: number) { if (n >= 10000) return `${(n / 10000).toFixed(1)}만P`; return `${n.toLocaleString()}P` }

type TabKey = 'overview' | 'markets' | 'create' | 'users' | 'economy' | 'battles' | 'bounties' | 'notify' | 'members' | 'reports' | 'stats'
const TAB_LABELS: Record<TabKey, string> = {
  overview: '📊 개요', markets: '📋 마켓 관리', create: '➕ 마켓 생성',
  users: '👥 포인트 관리', economy: '⚙️ 경제 설정', battles: '⚔️ 배틀 판정', bounties: '💰 현상금 관리', notify: '📢 공지 발송',
  members: '👤 유저 목록', reports: '🚨 신고 관리', stats: '📈 통계'
}

export default function AdminPage() {
  const router = useRouter()
  const {
    debates, currentUser, resolveDebate, cancelDebate, resetStore, logout,
    createDebate, walletBalance, whaleBattles, bounties, auctions,
    resolveBattle, loadWhaleBattles, loadBounties, loadAuctions,
    createBounty, resolveBounty, saveEconomySettings, adminAddPoints, economySettings,
  } = usePledgeStore()

  const [tab, setTab] = useState<TabKey>('overview')
  const [toast, setToast] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // 마켓 생성
  const [topic, setTopic] = useState(''); const [desc, setDesc] = useState('')
  const [sideA, setSideA] = useState(''); const [sideB, setSideB] = useState('')
  const [cat, setCat] = useState(''); const [days, setDays] = useState(7); const [pledge, setPledge] = useState(1000)

  // 경제 설정
  const [econ, setEcon] = useState<EconomySettings>(economySettings)

  // 포인트 지급
  const [targetUser, setTargetUser] = useState('')
  const [pointAmount, setPointAmount] = useState(10000)

  // 현상금 생성
  const [memberSearch, setMemberSearch] = useState('')
  const [members, setMembers] = useState<{id:string;username:string;wallet_balance:number;created_at:string}[]>([])
  const [membersLoaded, setMembersLoaded] = useState(false)
  const [reports, setReports] = useState<{id:string;reporter_username:string;target_type:string;target_id:string;reason:string;status:string;created_at:string}[]>([])
  const [reportsLoaded, setReportsLoaded] = useState(false)
  const [notifyTitle, setNotifyTitle] = useState('')
  const [notifyBody, setNotifyBody] = useState('')
  const [notifyLink, setNotifyLink] = useState('')
  const [notifySending, setNotifySending] = useState(false)
  const [bTopic, setBTopic] = useState('')
  const [bReward, setBReward] = useState(10000)
  const [bCondition, setBCondition] = useState('')
  const [bDays, setBDays] = useState(30)

  // 배틀 판정
  const [battleWinners, setBattleWinners] = useState<Record<string, string>>({})

  // 현상금 판정
  const [bountyWinners, setBountyWinners] = useState<Record<string, string>>({})

  useEffect(() => {
    loadWhaleBattles()
    loadBounties()
    loadAuctions()
  }, [loadWhaleBattles, loadBounties, loadAuctions])

  useEffect(() => { setEcon(economySettings) }, [economySettings])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type); setTimeout(() => setToast(null), 2500)
  }

  if (!currentUser.isAdmin) { router.replace('/'); return null }

  const liveDebates = debates.filter(d => d.status === 'live')
  const resolved = debates.filter(d => d.status === 'resolved')
  const totalPool = debates.reduce((a, d) => a + d.metrics.totalPool, 0)
  const CATS = ['거시경제', '크립토', '테크 / AI', '테크', '주식', '스포츠', '기타']

  const handleCreate = () => {
    if (!topic.trim()) return
    createDebate(topic, desc, sideA || 'YES', sideB || 'NO', cat || '기타', pledge, days)
    setTopic(''); setDesc(''); setSideA(''); setSideB(''); setCat('')
    showToast('✅ 마켓이 생성됐어요!')
  }

  const handleSaveEconomy = async () => {
    await saveEconomySettings(econ)
    showToast('✅ 경제 설정이 저장됐어요!')
  }

  const handleAddPoints = async () => {
    if (!targetUser.trim()) { showToast('아이디를 입력해주세요', 'error'); return }
    const ok = await adminAddPoints(targetUser.trim(), pointAmount)
    if (ok) showToast(`✅ @${targetUser}에게 ${pointAmount.toLocaleString()}P 지급 완료!`)
    else showToast('유저를 찾을 수 없어요', 'error')
    setTargetUser('')
  }

  const handleResolveBattle = async (battleId: string) => {
    const winnerId = battleWinners[battleId]
    if (!winnerId) { showToast('승자를 선택해주세요', 'error'); return }
    await resolveBattle(battleId, winnerId)
    showToast(`✅ 배틀 판정 완료 — 승자: @${winnerId}`)
  }

  const handleResolveBounty = async (bountyId: string) => {
    const winner = bountyWinners[bountyId]
    if (!winner?.trim()) { showToast('당첨자 아이디를 입력해주세요', 'error'); return }
    await resolveBounty(bountyId, winner.trim())
    showToast(`✅ 현상금 지급 완료 — 당첨자: @${winner}`)
  }

  const loadMembers = async () => {
    const { supabase } = await import('@/lib/supabase')
    const q = memberSearch.trim()
    let query = supabase.from('profiles').select('id, username, wallet_balance, created_at').order('created_at', { ascending: false }).limit(50)
    if (q) query = query.ilike('username', `%${q}%`)
    const { data } = await query
    if (data) setMembers(data)
    setMembersLoaded(true)
  }

  const loadReports = async () => {
    const { supabase } = await import('@/lib/supabase')
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(100)
    if (data) setReports(data)
    setReportsLoaded(true)
  }

  const handleDismissReport = async (reportId: string) => {
    const { supabase } = await import('@/lib/supabase')
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId)
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r))
    showToast('신고 기각됨')
  }

  const handleResolveReport = async (reportId: string) => {
    const { supabase } = await import('@/lib/supabase')
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r))
    showToast('신고 처리 완료')
  }

  const handleBroadcast = async () => {
    if (!notifyTitle.trim() || !notifyBody.trim()) { showToast('제목과 내용을 입력해주세요', 'error'); return }
    setNotifySending(true)
    await createAdminBroadcast(notifyTitle, notifyBody, notifyLink || undefined)
    setNotifySending(false)
    setNotifyTitle(''); setNotifyBody(''); setNotifyLink('')
    showToast('✅ 전체 유저에게 공지를 발송했어요!')
  }

  const handleCreateBounty = async () => {
    if (!bTopic.trim() || !bCondition.trim()) { showToast('주제와 조건을 입력해주세요', 'error'); return }
    await createBounty(bTopic, bReward, bCondition, bDays)
    setBTopic(''); setBCondition('')
    showToast('✅ 현상금이 생성됐어요!')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#fff' }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: toastType === 'error' ? '#EF4444' : '#1D4ED8', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 999 }}>{toast}</div>}

      <div style={{ padding: '28px 40px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900 }}>관리자 대시보드</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 4, fontSize: 14 }}>futuring Admin · @{currentUser.username}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/')} style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>← 홈</button>
          <button onClick={() => { logout(); router.push('/login') }} style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>로그아웃</button>
        </div>
      </div>

      <div style={{ padding: '0 40px', display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' as const }}>
        {(Object.keys(TAB_LABELS) as TabKey[]).map(k => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: tab === k ? '#1D4ED8' : 'rgba(255,255,255,0.06)', color: tab === k ? '#fff' : 'rgba(255,255,255,0.5)' }}>
            {TAB_LABELS[k]}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 40px 60px' }}>

        {/* 개요 */}
        {tab === 'overview' && (
          <div>
            {/* 🔴 정산 대기 알림 */}
            {debates.filter(d => d.status === 'pending_resolution').length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.15)', borderRadius: 16, padding: '20px 24px', border: '1.5px solid rgba(239,68,68,0.4)', marginBottom: 24 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#FCA5A5', marginBottom: 12 }}>
                  🔴 정산 대기 중 — {debates.filter(d => d.status === 'pending_resolution').length}개 마켓
                </p>
                {debates.filter(d => d.status === 'pending_resolution').map(d => (
                  <div key={d.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.topic}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>풀: {fmt(d.metrics.totalPool)} · 마감: {new Date(d.resolvesAt).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { resolveDebate(d.id, 'A'); showToast('✅ YES 승리로 정산됩니다') }} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.2)', color: '#34D399', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>YES승</button>
                      <button onClick={() => { resolveDebate(d.id, 'B'); showToast('✅ NO 승리로 정산됩니다') }} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.2)', color: '#EF4444', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>NO승</button>
                      <button onClick={() => { cancelDebate(d.id); showToast('환불 처리됩니다') }} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(148,163,184,0.15)', color: '#94A3B8', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>취소</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
              {([['전체 마켓', String(debates.length), '#fff'], ['진행 중', String(liveDebates.length), '#34D399'], ['종료됨', String(resolved.length), '#94A3B8'], ['총 풀', fmt(totalPool), '#60A5FA']] as [string, string, string][]).map(([l, v, c]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{l}</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: c }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>최근 마켓</p>
              {[...debates].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 13, color: '#E2E8F0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 16 }}>{d.topic}</p>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: '#60A5FA' }}>{fmt(d.metrics.totalPool)}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: d.status === 'live' ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.15)', color: d.status === 'live' ? '#34D399' : '#94A3B8' }}>
                      {d.status === 'live' ? '진행중' : d.status === 'pending_resolution' ? '⏳ 정산대기' : d.status === 'resolved' ? '종료' : '취소'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 마켓 관리 */}
        {tab === 'markets' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 15, fontWeight: 800 }}>전체 마켓 관리 ({debates.length}개)</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {['마켓', '카테고리', '풀', 'YES%', '상태', '관리'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {debates.map((d, i) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 16px', maxWidth: 280 }}><p style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.topic}</p></td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{d.category}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#60A5FA' }}>{fmt(d.metrics.totalPool)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#fff' }}>{Math.round(d.metrics.impliedProbA * 100)}%</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: d.status === 'live' ? 'rgba(52,211,153,0.2)' : d.status === 'pending_resolution' ? 'rgba(251,191,36,0.2)' : d.status === 'resolved' ? 'rgba(96,165,250,0.2)' : 'rgba(148,163,184,0.2)', color: d.status === 'live' ? '#34D399' : d.status === 'pending_resolution' ? '#FBD24' : d.status === 'resolved' ? '#60A5FA' : '#94A3B8' }}>
                          {d.status === 'live' ? '진행중' : d.status === 'pending_resolution' ? '⏳ 정산대기' : d.status === 'resolved' ? '종료' : '취소'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {d.status === 'live' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { resolveDebate(d.id, 'A'); showToast(`✅ YES 승리로 종료 — 모든 베터 정산됩니다`) }} style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(52,211,153,0.15)', color: '#34D399', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>YES승</button>
                            <button onClick={() => { resolveDebate(d.id, 'B'); showToast(`✅ NO 승리로 종료 — 모든 베터 정산됩니다`) }} style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>NO승</button>
                            <button onClick={() => { cancelDebate(d.id); showToast('취소 완료 — 전체 환불됩니다') }} style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(148,163,184,0.15)', color: '#94A3B8', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>취소</button>
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

        {/* 마켓 생성 */}
        {tab === 'create' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 28, border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>새 마켓 생성</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {([['마켓 주제 *', topic, setTopic, '예) 비트코인 2억원 돌파할까?'], ['설명', desc, setDesc, '부가 설명'], ['YES 선택지', sideA, setSideA, '예) YES — 돌파'], ['NO 선택지', sideB, setSideB, '예) NO — 미달']] as [string, string, (v: string) => void, string][]).map(([label, val, setter, ph]) => (
                  <div key={label}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input value={val} onChange={e => setter(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>카테고리</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                    {CATS.map(c => <button key={c} onClick={() => setCat(c)} style={{ padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: cat === c ? C.blue : 'rgba(255,255,255,0.08)', color: cat === c ? '#fff' : 'rgba(255,255,255,0.5)' }}>{c}</button>)}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>마감 기간</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[3, 7, 14, 30, 60].map(d => <button key={d} onClick={() => setDays(d)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: days === d ? C.blue : 'rgba(255,255,255,0.08)', color: days === d ? '#fff' : 'rgba(255,255,255,0.5)' }}>{d}일</button>)}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>초기 유동성</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[500, 1000, 2000, 5000].map(p => <button key={p} onClick={() => setPledge(p)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: pledge === p ? C.blue : 'rgba(255,255,255,0.08)', color: pledge === p ? '#fff' : 'rgba(255,255,255,0.5)' }}>{p / 1000}K</button>)}
                  </div>
                </div>
                <button onClick={handleCreate} disabled={!topic.trim()} style={{ padding: '14px 0', borderRadius: 12, background: topic.trim() ? C.blue : 'rgba(255,255,255,0.08)', color: topic.trim() ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: topic.trim() ? 'pointer' : 'not-allowed', fontSize: 15, fontWeight: 800, marginTop: 8 }}>
                  🚀 마켓 생성하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 포인트 관리 */}
        {tab === 'users' && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 28, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
              <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>특정 유저 포인트 지급</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Supabase DB에 직접 반영됩니다</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>유저 아이디</label>
                  <input value={targetUser} onChange={e => setTargetUser(e.target.value)} placeholder="아이디 입력" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>지급 금액</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                    {[1000, 5000, 10000, 50000, 100000, 500000].map(amt => (
                      <button key={amt} onClick={() => setPointAmount(amt)} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: pointAmount === amt ? C.blue : 'rgba(255,255,255,0.08)', color: pointAmount === amt ? '#fff' : 'rgba(255,255,255,0.5)' }}>{fmt(amt)}</button>
                    ))}
                  </div>
                </div>
                <button onClick={handleAddPoints} disabled={!targetUser.trim()} style={{ padding: '12px 0', borderRadius: 12, background: targetUser.trim() ? '#10B981' : 'rgba(255,255,255,0.08)', color: targetUser.trim() ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>
                  💰 {pointAmount.toLocaleString()}P 지급하기
                </button>
              </div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 16, padding: '16px 24px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 700, marginBottom: 12 }}>⚠️ 위험 구역</p>
              <button onClick={() => { if (confirm('모든 데이터를 초기화할까요?')) resetStore() }} style={{ padding: '10px 20px', borderRadius: 10, background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>전체 데이터 초기화</button>
            </div>
          </div>
        )}

        {/* 경제 설정 */}
        {tab === 'economy' && (
          <div style={{ maxWidth: 640 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 28, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
              <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>⚙️ 경제 수치 조정</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>설정 저장 시 Supabase DB에 반영되며 전체 서비스에 즉시 적용됩니다</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {([
                  ['일일 출석 보상 (P)', '매일 로그인 시 지급', 'dailyReward', 0, 10000, 100],
                  ['하우스 엣지 (%)', '베팅 수수료 — 소각 공급 조절', 'houseEdge', 0, 20, 0.5],
                  ['최대 베팅 한도 (잔액 %)', '단일 베팅 최대 비율', 'maxBetPct', 10, 100, 5],
                  ['고래 보유세 (연 %)', '5만P↑ 비활동 시 차감율', 'decayRate', 0, 10, 0.5],
                  ['소각율 (%)', '경매/현상금 낙찰 소각 비율', 'burnRate', 0, 30, 1],
                ] as [string, string, keyof EconomySettings, number, number, number][]).map(([label, desc, key, min, max, step]) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>{label}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#60A5FA' }}>{econ[key]}{label.includes('%') ? '%' : 'P'}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={econ[key]} onChange={e => setEcon(prev => ({ ...prev, [key]: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#2563EB' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}><span>{min}</span><span>{max}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={handleSaveEconomy} style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: '#1D4ED8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              💾 설정 저장 (DB 반영)
            </button>
          </div>
        )}

        {/* 배틀 판정 */}
        {tab === 'battles' && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>고래 배틀 판정 ({(whaleBattles as WhaleBattle[]).filter(b => b.status === 'live').length}개 진행중)</p>
            {(whaleBattles as WhaleBattle[]).filter(b => b.status === 'live').length === 0 && (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, textAlign: 'center' as const }}>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>판정 대기 중인 배틀이 없어요</p>
              </div>
            )}
            {(whaleBattles as WhaleBattle[]).filter(b => b.status === 'live').map(battle => (
              <div key={battle.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>⚔️ @{battle.challenger} vs @{battle.defender} — {battle.condition}</p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const }}>
                  <button onClick={() => setBattleWinners(p => ({ ...p, [battle.id]: battle.challenger }))}
                    style={{ padding: '8px 16px', borderRadius: 10, border: `2px solid ${battle.challengerColor}`, background: battleWinners[battle.id] === battle.challenger ? battle.challengerColor : 'transparent', color: battleWinners[battle.id] === battle.challenger ? '#fff' : battle.challengerColor, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    @{battle.challenger} 승
                  </button>
                  <button onClick={() => setBattleWinners(p => ({ ...p, [battle.id]: battle.defender }))}
                    style={{ padding: '8px 16px', borderRadius: 10, border: `2px solid ${battle.defenderColor}`, background: battleWinners[battle.id] === battle.defender ? battle.defenderColor : 'transparent', color: battleWinners[battle.id] === battle.defender ? '#fff' : battle.defenderColor, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    @{battle.defender} 승
                  </button>
                  <button onClick={() => handleResolveBattle(battle.id)} disabled={!battleWinners[battle.id]}
                    style={{ padding: '8px 16px', borderRadius: 10, background: battleWinners[battle.id] ? '#1D4ED8' : 'rgba(255,255,255,0.08)', color: battleWinners[battle.id] ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                    ✅ 판정 확정
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 현상금 관리 */}
        {tab === 'bounties' && (
          <div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 24, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>새 현상금 생성</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {([['주제', bTopic, setBTopic, '예) 비트코인 2억 돌파 최초 예측자'], ['판정 조건', bCondition, setBCondition, '예) 정답 베터 중 최초 베팅자']] as [string, string, (v: string) => void, string][]).map(([label, val, setter, ph]) => (
                  <div key={label}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input value={val} onChange={e => setter(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' }} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>보상 (P)</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                      {[5000, 10000, 30000, 50000, 100000].map(r => (
                        <button key={r} onClick={() => setBReward(r)} style={{ padding: '7px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: bReward === r ? C.blue : 'rgba(255,255,255,0.08)', color: bReward === r ? '#fff' : 'rgba(255,255,255,0.5)' }}>{r / 1000}K</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>기간 (일)</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[7, 14, 30, 60].map(d => (
                        <button key={d} onClick={() => setBDays(d)} style={{ flex: 1, padding: '7px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: bDays === d ? C.blue : 'rgba(255,255,255,0.08)', color: bDays === d ? '#fff' : 'rgba(255,255,255,0.5)' }}>{d}일</button>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={handleCreateBounty} disabled={!bTopic.trim() || !bCondition.trim()} style={{ padding: '12px 0', borderRadius: 12, background: bTopic.trim() && bCondition.trim() ? '#F59E0B' : 'rgba(255,255,255,0.08)', color: bTopic.trim() && bCondition.trim() ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>
                  💰 현상금 생성
                </button>
              </div>
            </div>

            <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>진행 중인 현상금 판정</p>
            {(bounties as Bounty[]).filter(b => b.status === 'live').length === 0 && (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, textAlign: 'center' as const, marginBottom: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>판정 대기 중인 현상금이 없어요</p>
              </div>
            )}
            {(bounties as Bounty[]).filter(b => b.status === 'live').map(bounty => (
              <div key={bounty.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>💰 {bounty.topic}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>보상: {bounty.reward.toLocaleString()}P · 참여자: {bounty.participants}명</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={bountyWinners[bounty.id] ?? ''}
                    onChange={e => setBountyWinners(p => ({ ...p, [bounty.id]: e.target.value }))}
                    placeholder="당첨자 아이디"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                  <button onClick={() => handleResolveBounty(bounty.id)} disabled={!bountyWinners[bounty.id]?.trim()}
                    style={{ padding: '9px 16px', borderRadius: 10, background: bountyWinners[bounty.id]?.trim() ? '#F59E0B' : 'rgba(255,255,255,0.08)', color: bountyWinners[bounty.id]?.trim() ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                    지급
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}


        {/* 공지 발송 */}
        {tab === 'notify' && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 28, border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>📢 전체 유저 공지 발송</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>모든 유저의 알림함에 즉시 전달됩니다</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>제목 *</label>
                  <input value={notifyTitle} onChange={e => setNotifyTitle(e.target.value)} placeholder="예) 🎉 신규 마켓 오픈" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>내용 *</label>
                  <textarea value={notifyBody} onChange={e => setNotifyBody(e.target.value)} placeholder="공지 내용을 입력하세요" rows={4} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none', resize: 'vertical' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>링크 (선택)</label>
                  <input value={notifyLink} onChange={e => setNotifyLink(e.target.value)} placeholder="예) /whale 또는 /market/xxx" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' }} />
                </div>
                <div style={{ background: 'rgba(251,191,36,0.1)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <p style={{ fontSize: 12, color: '#FCD34D', fontWeight: 600 }}>⚠️ 전체 유저에게 발송됩니다. 신중하게 작성해주세요.</p>
                </div>
                <button onClick={handleBroadcast} disabled={notifySending || !notifyTitle.trim() || !notifyBody.trim()}
                  style={{ padding: '13px 0', borderRadius: 12, background: notifyTitle.trim() && notifyBody.trim() ? '#F59E0B' : 'rgba(255,255,255,0.08)', color: notifyTitle.trim() && notifyBody.trim() ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>
                  {notifySending ? '발송 중...' : '📢 전체 발송'}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* 유저 목록 */}
        {tab === 'members' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="아이디 검색"
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none' }} />
              <button onClick={loadMembers} style={{ padding: '10px 20px', borderRadius: 10, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>검색</button>
            </div>
            {!membersLoaded ? (
              <button onClick={loadMembers} style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', fontSize: 14 }}>유저 목록 불러오기</button>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                  <thead><tr style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {['아이디', '잔액', '가입일'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#E2E8F0', fontWeight: 600 }}>@{m.username}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#60A5FA' }}>{m.wallet_balance.toLocaleString()}P</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{new Date(m.created_at).toLocaleDateString('ko-KR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {members.length === 0 && <p style={{ padding: '24px', textAlign: 'center' as const, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>유저가 없어요</p>}
              </div>
            )}
          </div>
        )}

        {/* 신고 관리 */}
        {tab === 'reports' && (
          <div>
            {!reportsLoaded ? (
              <button onClick={loadReports} style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', fontSize: 14 }}>신고 목록 불러오기</button>
            ) : reports.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: '40px', color: 'rgba(255,255,255,0.4)' }}>신고 내역이 없어요</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reports.map(r => (
                  <div key={r.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 18, border: `1px solid ${r.status==='pending'?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.08)'}`, opacity: r.status!=='pending'?0.6:1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>@{r.reporter_username} · {new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: r.status==='pending'?'rgba(239,68,68,0.2)':r.status==='resolved'?'rgba(52,211,153,0.2)':'rgba(148,163,184,0.2)', color: r.status==='pending'?'#EF4444':r.status==='resolved'?'#34D399':'#94A3B8', fontWeight: 700 }}>
                        {r.status==='pending'?'대기중':r.status==='resolved'?'처리됨':'기각'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#E2E8F0', marginBottom: 4 }}>{r.target_type === 'market' ? '마켓' : '댓글'} 신고 · {r.reason}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: r.status==='pending'?10:0 }}>대상 ID: {r.target_id}</p>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleResolveReport(r.id)} style={{ padding: '7px 14px', borderRadius: 9, background: 'rgba(52,211,153,0.15)', color: '#34D399', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>처리 완료</button>
                        <button onClick={() => handleDismissReport(r.id)} style={{ padding: '7px 14px', borderRadius: 9, background: 'rgba(148,163,184,0.15)', color: '#94A3B8', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>기각</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 통계 */}
        {tab === 'stats' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
              {[
                ['전체 마켓', String(debates.length)],
                ['진행 중', String(debates.filter(d=>d.status==='live').length)],
                ['정산 대기', String(debates.filter(d=>d.status==='pending_resolution').length)],
                ['종료됨', String(debates.filter(d=>d.status==='resolved').length)],
                ['총 베팅풀', `${(debates.reduce((s,d)=>s+d.metrics.totalPool,0)/10000).toFixed(0)}만P`],
                ['고래 배틀', String((whaleBattles as WhaleBattle[]).length)],
              ].map(([l,v]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{l}</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>카테고리별 마켓 수</p>
              {Array.from(new Set(debates.map(d=>d.category))).map((cat: string) => {
                const count = debates.filter(d=>d.category===cat).length
                const pool = debates.filter(d=>d.category===cat).reduce((s,d)=>s+d.metrics.totalPool,0)
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: '#E2E8F0', width: 100, flexShrink: 0 }}>{cat}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, count/debates.length*100)}%`, background: C.blue, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 60, textAlign: 'right' as const }}>{count}개</span>
                    <span style={{ fontSize: 12, color: '#60A5FA', width: 80, textAlign: 'right' as const }}>{(pool/10000).toFixed(0)}만P</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
