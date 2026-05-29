import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calcMarketMetrics, calcMarginalImpact, type MarketMetrics } from '@/lib/marketMath'
import { SHOP_ITEMS, type ShopCategory } from '@/lib/shopItems'

export type Side = string
export type DebateStatus = 'live' | 'resolved' | 'cancelled'

export interface MultiOption { id: string; name: string; pool: number }
export interface ProfileCustomization {
  ownedItemIds: string[]; ownedItemExpiry: Record<string, number>
  equippedFrame: string | null; equippedBadge: string | null; equippedTheme: string | null
}
export interface CurrentUser {
  isLoggedIn: boolean; username: string; winRate: number; totalPnL: number; isAdmin?: boolean
}
export interface Debate {
  id: string; topic: string; description: string; type: 'binary' | 'multi'
  owner?: string  // 마켓 오너 username
  sideA_name: string; sideB_name: string; sideA_pool: number; sideB_pool: number
  options?: MultiOption[]; status: DebateStatus; resolvedSide: Side | null
  resolvedOptionId?: string | null; category: string; createdAt: number; resolvesAt: number
  metrics: MarketMetrics
}
export type LedgerActionType = 'PLEDGE' | 'PAYOUT' | 'REFUND'
export interface LedgerEntry {
  id: string; timestamp: number; debateId: string; debateTopic: string
  action: LedgerActionType; side: Side | null; amount: number
  balanceBefore: number; balanceAfter: number; logitAtAction: number; impliedProbAtAction: number
}
export interface PledgePosition { debateId: string; side: Side; totalPledged: number; entries: number }

interface PledgeStore {
  currentUser: CurrentUser; walletBalance: number; debates: Debate[]
  ledger: LedgerEntry[]; positions: Record<string, PledgePosition>
  customization: ProfileCustomization; lastDailyRewardAt: number | null
  registeredUsers: Record<string, string>
  follows: Record<string, string[]>
  makePledge: (debateId: string, side: Side, amount: number) => void
  createDebate: (topic: string, description: string, sideA: string, sideB: string, category: string, initialPledge: number, durationDays?: number) => void
  createMultiDebate: (topic: string, description: string, category: string, options: { name: string }[], initialPledge: number, durationDays?: number) => void
  addDemoPoints: (amount: number) => void
  claimDailyReward: () => boolean
  resolveDebate: (debateId: string, winningSide: Side) => void
  cancelDebate: (debateId: string) => void
  login: (username: string, password: string) => boolean
  signup: (username: string, password: string) => boolean
  logout: () => void
  setUsername: (username: string) => void
  getDebate: (debateId: string) => Debate | undefined
  getPosition: (debateId: string, side: Side) => PledgePosition | undefined
  getLedgerForDebate: (debateId: string) => LedgerEntry[]
  getUserPledges: () => LedgerEntry[]
  resetStore: () => void
  followUser: (target: string) => void
  unfollowUser: (target: string) => void
  getFollowers: (target: string) => string[]
  getFollowing: (username: string) => string[]
  purchaseItem: (itemId: string) => void
  equipItem: (itemId: string) => void
  unequipCategory: (category: ShopCategory) => void
}

const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`
const now = () => Date.now()
const DAY_MS = 86_400_000

const withMetrics = (debate: Omit<Debate, 'metrics'>): Debate => ({
  ...debate,
  metrics: debate.type === 'multi' && debate.options
    ? calcMarketMetrics(debate.options.reduce((a,o) => a+o.pool,0), 0)
    : calcMarketMetrics(debate.sideA_pool, debate.sideB_pool),
})

function deriveUserStats(ledger: LedgerEntry[]) {
  const pledges = ledger.filter(e => e.action==='PLEDGE')
  const payouts = ledger.filter(e => e.action==='PAYOUT')
  const refunds = ledger.filter(e => e.action==='REFUND')
  const totalPledged = pledges.reduce((a,e) => a+e.amount, 0)
  const totalReceived = payouts.reduce((a,e) => a+e.amount,0) + refunds.reduce((a,e) => a+e.amount,0)
  const totalPnL = totalReceived - totalPledged
  const resolved = new Set(payouts.map(e => e.debateId))
  const played = new Set(pledges.map(e => e.debateId))
  const winRate = played.size===0 ? 0 : resolved.size/played.size
  return { winRate, totalPnL }
}

const INITIAL_DEBATES: Debate[] = [
  withMetrics({ id:'debate-001', type:'binary', topic:'2026년 내 연준 기준금리 4% 미만 인하', description:'연방준비제도가 2026년 3분기 말 이전에 기준금리를 4.00% 미만으로 인하할까요?', sideA_name:'YES — 4% 미만', sideB_name:'NO — 4% 유지', sideA_pool:3200, sideB_pool:1800, status:'live', resolvedSide:null, owner:'cjdmadldpdy123', category:'거시경제', createdAt:now()-DAY_MS*3, resolvesAt:now()+DAY_MS*60 }),
  withMetrics({ id:'debate-002', type:'binary', topic:'2026년 비트코인 도미넌스 60% 돌파', description:'비트코인 시장 점유율이 2026년 중 60%를 넘을까요?', sideA_name:'YES — 60% 초과', sideB_name:'NO — 60% 미만', sideA_pool:5500, sideB_pool:4100, status:'live', resolvedSide:null, owner:'cjdmadldpdy123', category:'크립토', createdAt:now()-DAY_MS*7, resolvesAt:now()+DAY_MS*45 }),
  withMetrics({ id:'debate-003', type:'binary', topic:'비트코인 2027년 전 2억원 돌파', description:'비트코인이 2027년 1월 1일 이전에 2억원을 기록할까요?', sideA_name:'YES — 2억원 돌파', sideB_name:'NO — 2억원 미달', sideA_pool:8200, sideB_pool:6100, status:'live', resolvedSide:null, owner:'cjdmadldpdy123', category:'크립토', createdAt:now()-DAY_MS*2, resolvesAt:now()+DAY_MS*90 }),
  withMetrics({ id:'debate-004', type:'binary', topic:'2027년까지 엔비디아 AI칩 1위 유지', description:'엔비디아가 2027년 말까지 AI 가속기 시장점유율 1위를 유지할까요?', sideA_name:'YES — 1위 유지', sideB_name:'NO — 순위 하락', sideA_pool:7400, sideB_pool:2600, status:'live', resolvedSide:null, owner:'cjdmadldpdy123', category:'테크 / AI', createdAt:now()-DAY_MS*5, resolvesAt:now()+DAY_MS*120 }),
  withMetrics({ id:'debate-005', type:'binary', topic:'애플 AR 글래스 2026년 출시', description:'애플이 2026년 12월 31일 이전에 소비자용 AR 글래스를 출시할까요?', sideA_name:'YES — 2026년 출시', sideB_name:'NO — 출시 연기', sideA_pool:2900, sideB_pool:5800, status:'live', resolvedSide:null, owner:'cjdmadldpdy123', category:'테크', createdAt:now()-DAY_MS*1, resolvesAt:now()+DAY_MS*75 }),
  withMetrics({ id:'debate-006', type:'binary', topic:'코스피 2026년 중 3,500 돌파', description:'코스피 지수가 2026년 중 3,500포인트를 기록할까요?', sideA_name:'YES — 3,500 돌파', sideB_name:'NO — 3,500 미달', sideA_pool:4100, sideB_pool:3900, status:'live', resolvedSide:null, owner:'cjdmadldpdy123', category:'주식', createdAt:now()-DAY_MS*4, resolvesAt:now()+DAY_MS*50 }),
  withMetrics({ id:'debate-007', type:'binary', topic:'GPT-5 2026년 3분기 전 공개 출시', description:'오픈AI가 2026년 7월 1일 이전에 GPT-5를 공개할까요?', sideA_name:'YES — 3분기 전 출시', sideB_name:'NO — 출시 지연', sideA_pool:6300, sideB_pool:3700, status:'live', resolvedSide:null, owner:'cjdmadldpdy123', category:'테크 / AI', createdAt:now()-DAY_MS*6, resolvesAt:now()+DAY_MS*40 }),
  withMetrics({ id:'debate-008', type:'binary', topic:'2026년 이더리움 시총이 비트코인 추월', description:'이더리움의 시가총액이 2026년 중 비트코인을 넘어설까요?', sideA_name:'YES — 이더 역전', sideB_name:'NO — 비트코인 우위', sideA_pool:1800, sideB_pool:7200, status:'live', resolvedSide:null, owner:'cjdmadldpdy123', category:'크립토', createdAt:now()-DAY_MS*10, resolvesAt:now()+DAY_MS*80 }),
  withMetrics({ id:'debate-009', type:'multi', topic:'2026 KBO 한국시리즈 우승팀', description:'2026년 KBO 한국시리즈 우승팀을 예측하세요.', sideA_name:'', sideB_name:'', sideA_pool:0, sideB_pool:0, options:[{ id:'opt-lg', name:'LG 트윈스', pool:2800 },{ id:'opt-kia', name:'KIA 타이거즈', pool:3200 },{ id:'opt-samsung', name:'삼성 라이온즈', pool:1500 },{ id:'opt-kt', name:'KT 위즈', pool:1200 },{ id:'opt-other', name:'기타 팀', pool:800 }], status:'live', resolvedSide:null, resolvedOptionId:null, owner:'cjdmadldpdy123', category:'스포츠', createdAt:now()-DAY_MS*2, resolvesAt:now()+DAY_MS*150 }),
]

const INITIAL_STATE = {
  currentUser: { isLoggedIn:false, username:'', winRate:0, totalPnL:0 } as CurrentUser,
  walletBalance: 5000,
  debates: INITIAL_DEBATES,
  ledger: [] as LedgerEntry[],
  positions: {} as Record<string, PledgePosition>,
  customization: { ownedItemIds:[], ownedItemExpiry:{}, equippedFrame:null, equippedBadge:null, equippedTheme:null } as ProfileCustomization,
  lastDailyRewardAt: null as number | null,
  registeredUsers: {} as Record<string, string>,
  follows: {} as Record<string, string[]>, // username -> following list
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const usePledgeStore = create<PledgeStore>()(persist((set: any, get: any) => ({
  ...INITIAL_STATE,

  makePledge: (debateId, side, amount) => {
    const state = get()
    const debate = state.debates.find(d => d.id===debateId)
    if (!debate) throw new Error(`Debate ${debateId} not found`)
    if (debate.status!=='live') throw new Error('Debate is not live')
    if (amount<=0) throw new Error('Amount must be positive')
    if (amount>state.walletBalance) throw new Error('Insufficient balance')
    const balanceBefore = state.walletBalance
    const balanceAfter = balanceBefore - amount
    const posKey = `${debateId}_${side}`
    if (debate.type==='multi') {
      const option = debate.options?.find(o => o.id===side)
      if (!option) throw new Error('Invalid option')
      const totalBefore = debate.options!.reduce((a,o) => a+o.pool, 0)
      const impliedProb = totalBefore>0 ? option.pool/totalBefore : 1/debate.options!.length
      const entry: LedgerEntry = { id:generateId(), timestamp:now(), debateId, debateTopic:debate.topic, action:'PLEDGE', side, amount, balanceBefore, balanceAfter, logitAtAction:0, impliedProbAtAction:impliedProb }
      set(s => {
        const newDebates = s.debates.map(d => { if (d.id!==debateId) return d; const newOptions = d.options!.map(o => o.id===side ? {...o, pool:o.pool+amount} : o); return {...d, options:newOptions} })
        const existing = s.positions[posKey]
        const newPositions = {...s.positions, [posKey]: existing ? {...existing, totalPledged:existing.totalPledged+amount, entries:existing.entries+1} : {debateId, side, totalPledged:amount, entries:1}}
        const newLedger = [entry, ...s.ledger]
        return { walletBalance:balanceAfter, debates:newDebates, ledger:newLedger, positions:newPositions, currentUser:{...s.currentUser, ...deriveUserStats(newLedger)} }
      })
      return
    }
    const snap = calcMarketMetrics(debate.sideA_pool, debate.sideB_pool)
    const entry: LedgerEntry = { id:generateId(), timestamp:now(), debateId, debateTopic:debate.topic, action:'PLEDGE', side, amount, balanceBefore, balanceAfter, logitAtAction:snap.logitOdds, impliedProbAtAction:side==='A'?snap.impliedProbA:snap.impliedProbB }
    set(s => {
      const newDebates = s.debates.map(d => { if (d.id!==debateId) return d; const newA = side==='A'?d.sideA_pool+amount:d.sideA_pool; const newB = side==='B'?d.sideB_pool+amount:d.sideB_pool; return {...d, sideA_pool:newA, sideB_pool:newB, metrics:calcMarketMetrics(newA,newB)} })
      const existing = s.positions[posKey]
      const newPositions = {...s.positions, [posKey]: existing ? {...existing, totalPledged:existing.totalPledged+amount, entries:existing.entries+1} : {debateId, side, totalPledged:amount, entries:1}}
      const newLedger = [entry, ...s.ledger]
      return { walletBalance:balanceAfter, debates:newDebates, ledger:newLedger, positions:newPositions, currentUser:{...s.currentUser, ...deriveUserStats(newLedger)} }
    })
  },

  createDebate: (topic, description, sideA, sideB, category, initialPledge, durationDays=30) => {
    const state = get()
    if (initialPledge<=0) throw new Error('Initial pledge must be positive')
    if (initialPledge>state.walletBalance) throw new Error('Insufficient balance')
    const half = Math.floor(initialPledge/2)
    const id = `debate-${generateId()}`
    const newDebate = withMetrics({ id, topic, description, type:'binary', sideA_name:sideA, sideB_name:sideB, sideA_pool:half, sideB_pool:initialPledge-half, status:'live', resolvedSide:null, category, createdAt:now(), resolvesAt:now()+DAY_MS*durationDays })
    const snap = calcMarketMetrics(half, initialPledge-half)
    const entry: LedgerEntry = { id:generateId(), timestamp:now(), debateId:id, debateTopic:topic, action:'PLEDGE', side:null, amount:initialPledge, balanceBefore:state.walletBalance, balanceAfter:state.walletBalance-initialPledge, logitAtAction:snap.logitOdds, impliedProbAtAction:0.5 }
    set(s => { const newLedger=[entry,...s.ledger]; return { debates:[newDebate,...s.debates], walletBalance:s.walletBalance-initialPledge, ledger:newLedger, currentUser:{...s.currentUser,...deriveUserStats(newLedger)} } })
  },

  createMultiDebate: (topic, description, category, options, initialPledge, durationDays=30) => {
    const state = get()
    if (initialPledge<=0) throw new Error('Initial pledge must be positive')
    if (initialPledge>state.walletBalance) throw new Error('Insufficient balance')
    if (options.length<2) throw new Error('Need at least 2 options')
    const perOption = Math.floor(initialPledge/options.length)
    const multiOptions = options.map((o,i) => ({ id:`opt-${i}-${generateId()}`, name:o.name, pool:i===options.length-1?initialPledge-(perOption*(options.length-1)):perOption }))
    const id = `debate-${generateId()}`
    const newDebate = withMetrics({ id, topic, description, type:'multi', sideA_name:'', sideB_name:'', sideA_pool:0, sideB_pool:0, options:multiOptions, status:'live', resolvedSide:null, resolvedOptionId:null, category, createdAt:now(), resolvesAt:now()+DAY_MS*durationDays })
    const entry: LedgerEntry = { id:generateId(), timestamp:now(), debateId:id, debateTopic:topic, action:'PLEDGE', side:null, amount:initialPledge, balanceBefore:state.walletBalance, balanceAfter:state.walletBalance-initialPledge, logitAtAction:0, impliedProbAtAction:0 }
    set(s => { const newLedger=[entry,...s.ledger]; return { debates:[newDebate,...s.debates], walletBalance:s.walletBalance-initialPledge, ledger:newLedger, currentUser:{...s.currentUser,...deriveUserStats(newLedger)} } })
  },

  resolveDebate: (debateId, winningSide) => {
    const state = get()
    const debate = state.debates.find(d => d.id===debateId)
    if (!debate||debate.status!=='live') return
    const winPos = state.positions[`${debateId}_${winningSide}`]
    set(s => {
      const newDebates = s.debates.map(d => d.id===debateId?{...d, status:'resolved' as const, resolvedSide:winningSide}:d)
      if (!winPos||winPos.totalPledged<=0) return { debates:newDebates }
      const metrics = calcMarketMetrics(debate.sideA_pool, debate.sideB_pool)
      const mul = winningSide==='A'?metrics.payoutMultiplierA:metrics.payoutMultiplierB
      const payout = Math.floor(winPos.totalPledged*mul)
      const entry: LedgerEntry = { id:generateId(), timestamp:now(), debateId, debateTopic:debate.topic, action:'PAYOUT', side:winningSide, amount:payout, balanceBefore:s.walletBalance, balanceAfter:s.walletBalance+payout, logitAtAction:metrics.logitOdds, impliedProbAtAction:winningSide==='A'?metrics.impliedProbA:metrics.impliedProbB }
      const newLedger=[entry,...s.ledger]
      return { debates:newDebates, walletBalance:s.walletBalance+payout, ledger:newLedger, currentUser:{...s.currentUser,...deriveUserStats(newLedger)} }
    })
  },

  cancelDebate: (debateId) => {
    const state = get()
    const debate = state.debates.find(d => d.id===debateId)
    if (!debate||debate.status!=='live') return
    const totalRefund = (['A','B'] as Side[]).reduce((acc,s) => acc+(state.positions[`${debateId}_${s}`]?.totalPledged??0), 0)
    set(s => {
      const newDebates = s.debates.map(d => d.id===debateId?{...d, status:'cancelled' as const}:d)
      if (totalRefund<=0) return { debates:newDebates }
      const entry: LedgerEntry = { id:generateId(), timestamp:now(), debateId, debateTopic:debate.topic, action:'REFUND', side:null, amount:totalRefund, balanceBefore:s.walletBalance, balanceAfter:s.walletBalance+totalRefund, logitAtAction:0, impliedProbAtAction:0.5 }
      const newLedger=[entry,...s.ledger]
      return { debates:newDebates, walletBalance:s.walletBalance+totalRefund, ledger:newLedger, currentUser:{...s.currentUser,...deriveUserStats(newLedger)} }
    })
  },

  claimDailyReward: () => {
    const state = get()
    const lastClaim = state.lastDailyRewardAt
    if (lastClaim && (now()-lastClaim) < DAY_MS) return false
    set(s => ({ walletBalance:s.walletBalance+200, lastDailyRewardAt:now() }))
    return true
  },

  login: (username, password) => {
    if (!username.trim()) return false
    if (username==='cjdmadldpdy123' && password==='dnjsanrhk1!') {
      set(s => ({ currentUser:{...s.currentUser, isLoggedIn:true, username, isAdmin:true} }))
      return true
    }
    const state = get()
    if (!state.registeredUsers[username]) return false
    if (state.registeredUsers[username]!==password) return false
    set(s => ({ currentUser:{...s.currentUser, isLoggedIn:true, username, isAdmin:false} }))
    return true
  },
  signup: (username, password) => {
    if (!username.trim()||!password.trim()) return false
    const state = get()
    if (state.registeredUsers[username]) return false
    if (username==='cjdmadldpdy123') return false
    set(s => ({ registeredUsers:{...s.registeredUsers, [username]:password} }))
    return true
  },
  logout: () => set(s => ({ currentUser:{...s.currentUser, isLoggedIn:false} })),
  setUsername: (username) => set(s => ({ currentUser:{...s.currentUser, username} })),
  getDebate: (debateId) => get().debates.find(d => d.id===debateId),
  getPosition: (debateId, side) => get().positions[`${debateId}_${side}`],
  getLedgerForDebate: (debateId) => get().ledger.filter(e => e.debateId===debateId),
  getUserPledges: () => get().ledger,
  resetStore: () => set(() => ({...INITIAL_STATE})),
  addDemoPoints: (amount) => set(s => ({ walletBalance:s.walletBalance+amount })),
  followUser: (target) => set(s => {
    const me = s.currentUser.username; if (!me || me===target) return s
    const cur = s.follows[me] ?? []
    if (cur.includes(target)) return s
    return { follows: {...s.follows, [me]: [...cur, target]} }
  }),
  unfollowUser: (target) => set(s => {
    const me = s.currentUser.username; if (!me) return s
    return { follows: {...s.follows, [me]: (s.follows[me]??[]).filter(u=>u!==target)} }
  }),
  getFollowers: (target) => {
    const s = usePledgeStore.getState()
    return Object.entries(s.follows as Record<string,string[]>).filter(([,fl])=>(fl as string[]).includes(target)).map(([u])=>u)
  },
  getFollowing: (username) => usePledgeStore.getState().follows[username] ?? [],
  purchaseItem: (itemId) => {
    const state = get(); const item = SHOP_ITEMS.find(i => i.id===itemId)
    if (!item||state.customization.ownedItemIds.includes(itemId)||item.price>state.walletBalance) return
    const expiresAt = item.durationDays ? now()+item.durationDays*DAY_MS : undefined
    set(s => ({ walletBalance:s.walletBalance-item.price, customization:{...s.customization, ownedItemIds:[...s.customization.ownedItemIds, itemId], ownedItemExpiry:expiresAt?{...s.customization.ownedItemExpiry,[itemId]:expiresAt}:s.customization.ownedItemExpiry} }))
  },
  equipItem: (itemId) => {
    const item = SHOP_ITEMS.find(i => i.id===itemId); if (!item) return
    const cust = get().customization
    if (!cust.ownedItemIds.includes(itemId)) return
    const expiry = cust.ownedItemExpiry[itemId]; if (expiry&&expiry<now()) return
    set(s => ({ customization:{...s.customization, equippedFrame:item.category==='frame'?itemId:s.customization.equippedFrame, equippedBadge:item.category==='badge'?itemId:s.customization.equippedBadge, equippedTheme:item.category==='theme'?itemId:s.customization.equippedTheme} }))
  },
  unequipCategory: (category) => set(s => ({ customization:{...s.customization, equippedFrame:category==='frame'?null:s.customization.equippedFrame, equippedBadge:category==='badge'?null:s.customization.equippedBadge, equippedTheme:category==='theme'?null:s.customization.equippedTheme} })),
}), {
  name: 'futuring-store-v3',
  version: 6,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: (persistedState: any, version: number): any => {
    const state = persistedState as Record<string, unknown>
    const result = {...state}
    if (version<2) { result.lastDailyRewardAt=null; result.customization={ownedItemIds:[],ownedItemExpiry:{},equippedFrame:null,equippedBadge:null,equippedTheme:null} }
    if (version<3) { const debates=(state.debates as Debate[]|undefined)??[]; result.debates=debates.map(d => ({...d, type:d.type??'binary'})) }
    if (version<4) { result.registeredUsers={} }
    if (version<5) { result.whaleBattles=[] }
    return result
  },
}))

export const selectLiveDebates = (s: PledgeStore) => s.debates.filter(d => d.status==='live')
export const selectMarginalImpact = (id: string, side: Side, amount: number) => (s: PledgeStore) => {
  const d = s.debates.find(x => x.id===id)
  if (!d||d.type==='multi') return 0
  return calcMarginalImpact(d.sideA_pool, d.sideB_pool, side as 'A' | 'B', amount)
}
