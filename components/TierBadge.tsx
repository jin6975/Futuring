'use client'
import { useRouter } from 'next/navigation'
import { getTier, getNextTier, getTierProgress } from '@/lib/tiers'

export function TierBadge({ points, size='sm' }: { points:number; size?:'sm'|'md'|'lg' }) {
  const router = useRouter()
  const tier = getTier(points)
  const s = {sm:{fontSize:11,padding:'2px 8px',emojiSize:12},md:{fontSize:13,padding:'4px 12px',emojiSize:14},lg:{fontSize:15,padding:'6px 16px',emojiSize:18}}[size]
  return (
    <span onClick={()=>router.push('/tiers')} style={{ display:'inline-flex', alignItems:'center', gap:4, background:tier.bg, color:tier.color, fontSize:s.fontSize, fontWeight:700, padding:s.padding, borderRadius:99, border:`1px solid ${tier.border}`, cursor:'pointer' }}>
      <span style={{ fontSize:s.emojiSize }}>{tier.emoji}</span>
      {tier.name}
    </span>
  )
}

export function TierProgressBar({ points }: { points:number }) {
  const router = useRouter()
  const tier = getTier(points)
  const next = getNextTier(points)
  const progress = getTierProgress(points)
  return (
    <div style={{ width:'100%', cursor:'pointer' }} onClick={()=>router.push('/tiers')}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <TierBadge points={points} size="sm" />
        {next && <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>다음: {next.emoji} {next.name}</span>}
      </div>
      <div style={{ height:6, borderRadius:99, background:'rgba(255,255,255,0.15)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${tier.color}88,${tier.color})`, borderRadius:99, transition:'width 0.8s' }}/>
      </div>
      {next && <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:4 }}>{(next.minPoints-points).toLocaleString()}P 더 모으면 승급 →</p>}
    </div>
  )
}
