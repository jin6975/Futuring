'use client'
import { useState, useEffect, Suspense } from 'react'
import { usePledgeStore , type PledgePosition} from '@/store/usePledgeStore'
import { useSearchParams } from 'next/navigation'
import { useDevice } from '@/lib/useDevice'
import { useRouter } from 'next/navigation'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import { TierBadge, TierProgressBar } from '@/components/TierBadge'
import { C } from '@/lib/constants'
import Link from 'next/link'
import { fetchNotifSettings, saveNotifSettings } from '@/lib/notifications'
import { usePushNotification } from '@/lib/usePushNotification'

function NotifSettingsPanel({ userId }: { userId: string }) {
  const [settings, setSettings] = useState({ payout_alert: true, deadline_alert: true, first_bet_alert: true, admin_alert: true })
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetchNotifSettings(userId).then(s => {
      setSettings({ payout_alert: s.payout_alert ?? true, deadline_alert: s.deadline_alert ?? true, first_bet_alert: s.first_bet_alert ?? true, admin_alert: s.admin_alert ?? true })
      setLoaded(true)
    })
  }, [userId])

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    await saveNotifSettings(userId, settings)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!loaded) return <div style={{ textAlign:'center', padding:40, color:C.gray }}>불러오는 중...</div>

  const ITEMS = [
    { key: 'payout_alert', label: '💰 베팅 정산 알림', desc: '내가 베팅한 마켓이 정산되거나 취소될 때' },
    { key: 'deadline_alert', label: '⏰ 마감 임박 알림', desc: '내가 베팅한 마켓 마감 24시간 전' },
    { key: 'first_bet_alert', label: '🎯 첫 베팅 알림', desc: '내가 만든 마켓에 처음 베팅이 들어올 때' },
    { key: 'admin_alert', label: '📢 관리자 공지', desc: '운영팀이 보내는 중요 공지' },
  ] as const

  const { permission, subscribed, subscribe, unsubscribe } = usePushNotification()

  return (
    <div style={{ background:C.white, borderRadius:20, border:`1px solid ${C.grayBorder}`, overflow:'hidden' }}>
      <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.grayBorder}` }}>
        <p style={{ fontSize:15, fontWeight:800, color:C.navy }}>🔔 알림 설정</p>
        <p style={{ fontSize:12, color:C.gray, marginTop:2 }}>받고 싶은 알림 유형을 선택하세요</p>
      </div>
      {/* 브라우저 푸시 알림 */}
      <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.grayBorder}`, background:'#F8FAFF' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:C.navy }}>📲 브라우저 푸시 알림</p>
            <p style={{ fontSize:12, color:C.gray, marginTop:2 }}>사이트 밖에서도 핸드폰/PC에 알림이 와요</p>
            {permission === 'denied' && <p style={{ fontSize:11, color:C.red, marginTop:4 }}>브라우저 설정에서 알림을 허용해주세요</p>}
          </div>
          {permission !== 'denied' && (
            <button onClick={subscribed ? unsubscribe : subscribe}
              style={{ padding:'8px 16px', borderRadius:10, border:`1.5px solid ${subscribed?C.blue:C.grayBorder}`, background:subscribed?C.bluePale:'transparent', color:subscribed?C.blue:C.gray, fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
              {subscribed ? '✅ 허용됨' : '허용하기'}
            </button>
          )}
        </div>
      </div>
      <div style={{ padding:'8px 0' }}>
        {ITEMS.map(item => (
          <div key={item.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:`1px solid ${C.grayBorder}` }}>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:C.navy }}>{item.label}</p>
              <p style={{ fontSize:12, color:C.gray, marginTop:2 }}>{item.desc}</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key] }))}
              style={{ width:44, height:24, borderRadius:99, border:'none', cursor:'pointer', background:settings[item.key]?C.blue:C.grayBorder, position:'relative', transition:'background 0.2s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:2, left:settings[item.key]?22:2, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ padding:'16px 20px' }}>
        <button onClick={handleSave} disabled={saving}
          style={{ width:'100%', padding:'12px 0', borderRadius:12, background:saved?C.green:C.blue, color:'#fff', border:'none', cursor:'pointer', fontSize:14, fontWeight:700 }}>
          {saved ? '✅ 저장됨' : saving ? '저장 중...' : '설정 저장'}
        </button>
      </div>
    </div>
  )
}

function ProfileInner() {
  const { currentUser, walletBalance, ledger, debates, positions, claimDailyReward, logout, setUsername, followUser, unfollowUser, getFollowers, getFollowing } = usePledgeStore()
  const device = useDevice(); const isMobile = device === 'mobile'
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'overview'|'positions'|'history'|'follows'|'notifications'>(
    (searchParams.get('tab') as 'notifications') ?? 'overview'
  )
  const [notifSettings, setNotifSettings] = useState({ payout_alert: true, deadline_alert: true, first_bet_alert: true, admin_alert: true })
  const [notifLoaded, setNotifLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentUser.username)
  const [claimed, setClaimed] = useState(false)

  const followers = getFollowers(currentUser.username)
  const following = getFollowing(currentUser.username)
  const won = ledger.filter(e=>e.action==='PAYOUT').length
  const total = new Set(ledger.filter(e=>e.action==='PLEDGE').map(e=>e.debateId)).size
  const winRate = total > 0 ? Math.round((won/total)*100) : 0
  const pnl = ledger.filter(e=>e.action==='PAYOUT').reduce((s,e)=>s+e.amount,0) - ledger.filter(e=>e.action==='PLEDGE').reduce((s,e)=>s+e.amount,0)

  const activePositions = (Object.values(positions) as PledgePosition[]).filter(p => {
    const d = debates.find(x=>x.id===p.debateId)
    return d?.status === 'live'
  })
  const closedPositions = (Object.values(positions) as PledgePosition[]).filter(p => {
    const d = debates.find(x=>x.id===p.debateId)
    return d && d.status !== 'live'
  })

  const Nav = isMobile ? FuturingNav : PCNav

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Nav/>
      <div style={{ maxWidth:isMobile?undefined:800, margin:'0 auto', padding:isMobile?'20px 16px 100px':'40px 40px 60px' }}>

        {/* 프로필 카드 */}
        <div style={{ background:`linear-gradient(135deg,${C.navy} 0%,#1E3A8A 100%)`, borderRadius:24, padding:24, marginBottom:20, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
            <div style={{ width:64, height:64, borderRadius:20, background:`linear-gradient(135deg,${C.blueMid},${C.blue})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:C.white, flexShrink:0 }}>
              {(currentUser.username[0]||'?').toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              {editing
                ? <div style={{ display:'flex', gap:8 }}>
                    <input value={name} onChange={e=>setName(e.target.value)} style={{ flex:1, padding:'8px 12px', borderRadius:10, border:'none', fontSize:15, fontWeight:700 }}/>
                    <button onClick={()=>{setUsername(name);setEditing(false)}} style={{ padding:'8px 14px', borderRadius:10, background:C.blue, color:C.white, border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>저장</button>
                  </div>
                : <div>
                    <p style={{ fontSize:20, fontWeight:800, color:C.white }}>{currentUser.username}</p>
                    <div style={{ marginTop:6 }}><TierBadge points={walletBalance} size="sm" /></div>
                    <button onClick={()=>setEditing(true)} style={{ fontSize:12, color:'rgba(255,255,255,0.5)', background:'none', border:'none', cursor:'pointer', padding:0, marginTop:4, display:'block' }}>닉네임 수정</button>
                  </div>
              }
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            {[
              ['보유 포인트', `${walletBalance.toLocaleString()}P`, '#fff'],
              [pnl>=0?'누적 수익':'누적 손실', `${pnl>=0?'+':''}${pnl.toLocaleString()}P`, '#93C5FD'],
              ['팔로워', `${followers.length}명`, '#6EE7B7'],
              ['팔로잉', `${following.length}명`, '#FCD34D'],
            ].map(([l,v,c])=>(
              <div key={String(l)} style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 14px' }}>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:3 }}>{l}</p>
                <p style={{ fontSize:15, fontWeight:800, color:String(c) }}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 16px' }}>
            <TierProgressBar points={walletBalance} />
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          <button onClick={()=>{const ok=claimDailyReward();if(ok)setClaimed(true)}} disabled={claimed}
            style={{ flex:1, padding:'12px 0', borderRadius:14, background:claimed?C.grayLight:C.green, color:claimed?C.gray:C.white, border:'none', cursor:claimed?'not-allowed':'pointer', fontSize:14, fontWeight:700 }}>
            {claimed?'✅ 출석 완료':'🎁 일일 출석 보상'}
          </button>
          <Link href="/shop" style={{ flex:1, textDecoration:'none' }}>
            <button style={{ width:'100%', padding:'12px 0', borderRadius:14, background:C.bluePale, color:C.blue, border:`1.5px solid ${C.blueMid2}`, cursor:'pointer', fontSize:14, fontWeight:700 }}>🛍 상점</button>
          </Link>
          <Link href="/tiers" style={{ flex:1, textDecoration:'none' }}>
            <button style={{ width:'100%', padding:'12px 0', borderRadius:14, background:C.bluePale, color:C.blue, border:`1.5px solid ${C.blueMid2}`, cursor:'pointer', fontSize:14, fontWeight:700 }}>🏅 티어표</button>
          </Link>
        </div>

        {/* 탭 */}
        <div style={{ display:'flex', background:C.grayLight, borderRadius:12, padding:4, marginBottom:20 }}>
          {([['overview','📊 개요'],['positions','🎯 포지션'],['history','📋 거래내역'],['follows','👥 팔로우'],['notifications','🔔 알림']] as const).map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:'10px 0', borderRadius:9, border:'none', cursor:'pointer', fontSize:isMobile?12:14, fontWeight:700, background:tab===k?C.white:'transparent', color:tab===k?C.navy:C.gray, boxShadow:tab===k?'0 1px 4px rgba(0,0,0,0.08)':'none' }}>{l}</button>
          ))}
        </div>

        {/* 개요 탭 */}
        {tab==='overview'&&(
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            {[['참여 마켓',`${total}개`],['승률',`${winRate}%`],['진행중 포지션',`${activePositions.length}개`],['완료된 포지션',`${closedPositions.length}개`]].map(([l,v])=>(
              <div key={String(l)} style={{ background:C.white, borderRadius:16, padding:'16px 18px', border:`1px solid ${C.grayBorder}` }}>
                <p style={{ fontSize:12, color:C.gray, marginBottom:6 }}>{l}</p>
                <p style={{ fontSize:22, fontWeight:800, color:C.navy }}>{v}</p>
              </div>
            ))}
          </div>
        )}

        {/* 포지션 탭 */}
        {tab==='positions'&&(
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {activePositions.length===0&&closedPositions.length===0&&(
              <div style={{ textAlign:'center', padding:'60px 20px', background:C.white, borderRadius:20, border:`1px solid ${C.grayBorder}` }}>
                <p style={{ fontSize:15, fontWeight:700, color:C.navy }}>포지션이 없어요</p>
                <Link href="/"><button style={{ marginTop:12, padding:'10px 24px', borderRadius:12, background:C.blue, color:C.white, border:'none', cursor:'pointer', fontSize:14, fontWeight:700 }}>마켓 둘러보기</button></Link>
              </div>
            )}
            {activePositions.length>0&&<p style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:4 }}>진행 중 ({activePositions.length})</p>}
            {activePositions.map(p=>{
              const d = debates.find(x=>x.id===p.debateId)!
              const sideName = d.type==='multi'?(d.options?.find(o=>o.id===p.side)?.name??p.side):p.side==='A'?d.sideA_name:d.sideB_name
              const pct = d.type==='binary'?(p.side==='A'?Math.round(d.metrics.impliedProbA*100):Math.round(d.metrics.impliedProbB*100)):null
              return (
                <Link key={p.debateId} href={`/market/${p.debateId}`} style={{ textDecoration:'none' }}>
                  <div style={{ background:C.white, borderRadius:16, padding:16, border:`1px solid ${C.grayBorder}` }}>
                    <p style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:8 }}>{d.topic}</p>
                    <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:C.blue, background:C.bluePale, borderRadius:7, padding:'3px 8px' }}>{sideName}</span>
                        <span style={{ fontSize:12, color:C.gray }}>{p.totalPledged.toLocaleString()}P</span>
                        {pct&&<span style={{ fontSize:12, color:C.gray }}>현재 {pct}%</span>}
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:C.green, background:C.greenPale, padding:'3px 8px', borderRadius:99 }}>● 진행중</span>
                    </div>
                  </div>
                </Link>
              )
            })}
            {closedPositions.length>0&&<p style={{ fontSize:14, fontWeight:700, color:C.navy, marginTop:8, marginBottom:4 }}>완료됨 ({closedPositions.length})</p>}
            {closedPositions.map(p=>{
              const d = debates.find(x=>x.id===p.debateId)!
              const isWin = d.resolvedSide===p.side
              const payout = ledger.find(e=>e.debateId===p.debateId&&e.action==='PAYOUT')
              const sideName = d.type==='multi'?(d.options?.find(o=>o.id===p.side)?.name??p.side):p.side==='A'?d.sideA_name:d.sideB_name
              return (
                <div key={p.debateId} style={{ background:C.white, borderRadius:16, padding:16, border:`1px solid ${C.grayBorder}` }}>
                  <p style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:8 }}>{d.topic}</p>
                  <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:C.blue, background:C.bluePale, borderRadius:7, padding:'3px 8px' }}>{sideName}</span>
                      <span style={{ fontSize:12, color:C.gray }}>{p.totalPledged.toLocaleString()}P</span>
                    </div>
                    <span style={{ fontSize:14, fontWeight:800, color:isWin?C.green:C.red }}>
                      {d.status==='resolved'?(isWin&&payout?`+${payout.amount.toLocaleString()}P ✅`:`-${p.totalPledged.toLocaleString()}P ❌`):'환불'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 거래내역 탭 */}
        {tab==='history'&&(
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {ledger.length===0&&<div style={{ textAlign:'center', padding:'60px 20px', background:C.white, borderRadius:20, border:`1px solid ${C.grayBorder}` }}><p style={{ color:C.gray }}>거래 내역이 없어요</p></div>}
            {ledger.slice(0,30).map(e=>(
              <div key={e.id} style={{ background:C.white, borderRadius:14, padding:'14px 16px', border:`1px solid ${C.grayBorder}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:3 }}>{e.debateTopic || '마켓 거래'}</p>
                  <p style={{ fontSize:11, color:C.gray }}>{new Date(e.timestamp).toLocaleDateString('ko-KR')} · {e.action==='PLEDGE'?'베팅':e.action==='PAYOUT'?'수령':'환불'}</p>
                </div>
                <span style={{ fontSize:14, fontWeight:800, color:e.action==='PLEDGE'?C.red:C.green }}>
                  {e.action==='PLEDGE'?'-':'+'}{e.amount.toLocaleString()}P
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 팔로우 탭 */}
        {tab==='follows'&&(
          <div>
            <div style={{ display:'flex', background:C.grayLight, borderRadius:10, padding:3, marginBottom:16 }}>
              <div style={{ flex:1, padding:'8px 0', textAlign:'center', fontSize:14, fontWeight:700, color:C.navy }}>팔로워 {followers.length}</div>
              <div style={{ flex:1, padding:'8px 0', textAlign:'center', fontSize:14, fontWeight:700, color:C.navy }}>팔로잉 {following.length}</div>
            </div>
            {following.length===0&&followers.length===0&&(
              <div style={{ textAlign:'center', padding:'40px 20px', background:C.white, borderRadius:20, border:`1px solid ${C.grayBorder}` }}>
                <p style={{ fontSize:14, color:C.gray }}>아직 팔로우 관계가 없어요</p>
                <p style={{ fontSize:13, color:C.gray, marginTop:6 }}>커뮤니티에서 다른 유저 프로필을 방문해보세요!</p>
              </div>
            )}
            {following.map(u=>(
              <div key={u} style={{ background:C.white, borderRadius:14, padding:'14px 16px', border:`1px solid ${C.grayBorder}`, display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${C.blueMid},${C.blue})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16, fontWeight:800 }}>{u[0].toUpperCase()}</div>
                  <p style={{ fontSize:14, fontWeight:700, color:C.navy }}>@{u}</p>
                </div>
                <button onClick={()=>unfollowUser(u)} style={{ padding:'7px 14px', borderRadius:10, background:C.grayLight, color:C.gray, border:`1px solid ${C.grayBorder}`, cursor:'pointer', fontSize:13, fontWeight:700 }}>언팔로우</button>
              </div>
            ))}
          </div>
        )}

        {/* 알림 설정 탭 */}
        {tab==='notifications'&&(
          <NotifSettingsPanel userId={currentUser.userId ?? ''} />
        )}

        {/* 로그아웃 */}
        <div style={{ marginTop:24 }}>
          <button onClick={()=>{logout();router.push('/login')}} style={{ width:'100%', padding:'13px 0', borderRadius:14, background:C.grayLight, color:C.gray, border:'none', cursor:'pointer', fontSize:14, fontWeight:700 }}>로그아웃</button>
        </div>
      </div>
      {isMobile&&<BottomNav/>}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>로딩 중...</div>}>
      <ProfileInner />
    </Suspense>
  )
}
