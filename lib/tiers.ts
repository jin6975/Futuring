export interface Tier {
  name: string; emoji: string; minPoints: number; maxPoints?: number
  color: string; bg: string; border: string; description: string; isWhale?: boolean; rank: number
}
export const TIERS: Tier[] = [
  { rank:0,  name:'루키',          emoji:'🌱', minPoints:0,              color:'#6B7280', bg:'#F9FAFB', border:'#D1D5DB', description:'예측의 시작' },
  { rank:1,  name:'브론즈',        emoji:'🥉', minPoints:10_000,         color:'#92400E', bg:'#FEF3C7', border:'#D97706', description:'예측의 첫 걸음' },
  { rank:2,  name:'실버',          emoji:'🥈', minPoints:100_000,        color:'#475569', bg:'#F8FAFC', border:'#94A3B8', description:'성장 중인 예측가' },
  { rank:3,  name:'골드',          emoji:'🏅', minPoints:500_000,        color:'#B45309', bg:'#FFFBEB', border:'#FCD34D', description:'황금빛 예측가' },
  { rank:4,  name:'플래티넘',      emoji:'💠', minPoints:1_000_000,      color:'#0E7490', bg:'#ECFEFF', border:'#22D3EE', description:'상위 예측가' },
  { rank:5,  name:'다이아몬드',    emoji:'💎', minPoints:5_000_000,      color:'#1D4ED8', bg:'#EFF6FF', border:'#60A5FA', description:'엘리트 트레이더' },
  { rank:6,  name:'마스터',        emoji:'👑', minPoints:10_000_000,     color:'#7C3AED', bg:'#F5F3FF', border:'#A78BFA', description:'마켓의 지배자' },
  { rank:7,  name:'그랜드마스터',  emoji:'🔱', minPoints:50_000_000,     color:'#BE185D', bg:'#FDF2F8', border:'#F9A8D4', description:'전설의 예측가' },
  { rank:8,  name:'브론즈 웨일',   emoji:'🐋', minPoints:100_000_000,    color:'#92400E', bg:'#FEF3C7', border:'#D97706', description:'고래의 입문', isWhale:true },
  { rank:9,  name:'실버 웨일',     emoji:'🐋', minPoints:300_000_000,    color:'#475569', bg:'#F8FAFC', border:'#94A3B8', description:'검증된 고래', isWhale:true },
  { rank:10, name:'골드 웨일',     emoji:'🐋', minPoints:500_000_000,    color:'#B45309', bg:'#FEF3C7', border:'#FCD34D', description:'황금빛 고래', isWhale:true },
  { rank:11, name:'다이아몬드 웨일',emoji:'💎',minPoints:1_000_000_000,  color:'#1D4ED8', bg:'#EFF6FF', border:'#60A5FA', description:'전설의 고래', isWhale:true },
  { rank:12, name:'마스터 웨일',   emoji:'🌊', minPoints:3_000_000_000,  color:'#7C3AED', bg:'#F5F3FF', border:'#A78BFA', description:'바다의 지배자', isWhale:true },
]
export function getTier(p: number): Tier { return [...TIERS].reverse().find(t=>p>=t.minPoints)??TIERS[0] }
export function getNextTier(p: number): Tier|null { const i=TIERS.findIndex(t=>t.name===getTier(p).name); return i<TIERS.length-1?TIERS[i+1]:null }
export function getTierProgress(p: number): number { const c=getTier(p),n=getNextTier(p); if(!n)return 100; return Math.min(100,Math.round(((p-c.minPoints)/(n.minPoints-c.minPoints))*100)) }
export function isWhaleUser(p: number): boolean { return p>=100_000_000 }
function fmtP(n:number):string { if(n>=100_000_000)return`${(n/100_000_000).toFixed(0)}억`; if(n>=10_000)return`${(n/10_000).toFixed(0)}만`; return n.toLocaleString() }
export function getTierRange(t: Tier): string { const next=TIERS[TIERS.findIndex(x=>x.name===t.name)+1]; return `${fmtP(t.minPoints)}P ~ ${next?fmtP(next.minPoints-1)+'P':'∞'}` }
