'use client'
import { useParams } from 'next/navigation'
import { usePledgeStore } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import { TierBadge } from '@/components/TierBadge'
import { C } from '@/lib/constants'

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { currentUser, followUser, unfollowUser, getFollowers, getFollowing } = usePledgeStore()
  const device = useDevice(); const isMobile = device === 'mobile'
  const Nav = isMobile ? FuturingNav : PCNav

  const isMe = currentUser.username === username
  const followers = getFollowers(username)
  const following = getFollowing(username)
  const isFollowing = getFollowing(currentUser.username).includes(username)

  // 임의 포인트 (실제 멀티유저 구현 전 시뮬레이션)
  const hash = username.split('').reduce((a,c)=>a+c.charCodeAt(0),0)
  const simPoints = (hash % 9000 + 1000) * 100

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Nav/>
      <div style={{ maxWidth:600, margin:'0 auto', padding:isMobile?'20px 16px 100px':'40px 40px 60px' }}>
        <div style={{ background:`linear-gradient(135deg,${C.navy} 0%,#1E3A8A 100%)`, borderRadius:24, padding:28, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
            <div style={{ width:64, height:64, borderRadius:20, background:`linear-gradient(135deg,${C.blueMid},${C.blue})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'#fff' }}>
              {username[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:20, fontWeight:800, color:'#fff' }}>@{username}</p>
              <div style={{ marginTop:6 }}><TierBadge points={simPoints} size="sm" /></div>
            </div>
            {!isMe && (
              <button onClick={()=>isFollowing?unfollowUser(username):followUser(username)}
                style={{ padding:'10px 20px', borderRadius:12, background:isFollowing?C.grayLight:C.blue, color:isFollowing?C.gray:'#fff', border:'none', cursor:'pointer', fontSize:14, fontWeight:700 }}>
                {isFollowing?'팔로잉':'+ 팔로우'}
              </button>
            )}
          </div>
          <div style={{ display:'flex', gap:16 }}>
            <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 16px' }}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>팔로워</p>
              <p style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{followers.length}</p>
            </div>
            <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 16px' }}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>팔로잉</p>
              <p style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{following.length}</p>
            </div>
          </div>
        </div>
        {isMe && (
          <div style={{ background:C.bluePale, borderRadius:14, padding:'12px 16px', border:`1px solid ${C.blueMid2}`, fontSize:13, color:C.blue, fontWeight:600 }}>
            내 프로필을 보고 있어요. <a href="/profile" style={{ color:C.blue, fontWeight:800 }}>전체 프로필 →</a>
          </div>
        )}
      </div>
      {isMobile&&<BottomNav/>}
    </div>
  )
}
