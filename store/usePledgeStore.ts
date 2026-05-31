import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calcMarketMetrics, calcMarginalImpact, type MarketMetrics } from '@/lib/marketMath'
import { SHOP_ITEMS, type ShopCategory } from '@/lib/shopItems'
import { supabase } from '@/lib/supabase'

export type Side = string
export type DebateStatus = 'live' | 'resolved' | 'cancelled'

export interface MultiOption { id: string; name: string; pool: number }
export interface ProfileCustomization {
  ownedItemIds: string[]; ownedItemExpiry: Record<string, number>
  equippedFrame: string | null; equippedBadge: string | null; equippedTheme: string | null
}
export interface CurrentUser {
  isLoggedIn: boolean; username: string; winRate: number; totalPnL: number; isAdmin?: boolean
  userId?: string
}
export interface Debate {
  id: string; topic: string; description: string; type: 'binary' | 'multi'
  owner?: string
  sideA_name: string; sideB_name: string; sideA_pool: number; sideB_pool: number
  options?: MultiOption[]; status: DebateStatus; resolvedSide: Side | null
  resolvedOptionId?: string | null; category: string; createdAt: number; resolvesAt: number
  metrics: MarketMetrics; ticker?: string
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
  makePledge: (debateId: string, side: Side, amount: number) => Promise<void>
  createDebate: (topic: string, description: string, sideA: string, sideB: string, category: string, initialPledge: number, durationDays?: number) => Promise<void>
  createMultiDebate: (topic: string, description: string, category: string, options: { name: string }[], initialPledge: number, durationDays?: number) => Promise<void>
  addDemoPoints: (amount: number) => void
  claimDailyReward: () => boolean
  resolveDebate: (debateId: string, winningSide: Side) => Promise<void>
  cancelDebate: (debateId: string) => Promise<void>
  login: (username: string, password: string) => Promise<boolean>
  signup: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  setUsername: (username: string) => void
  getDebate: (debateId: string) => Debate | undefined
  getPosition: (debateId: string, side: Side) => PledgePosition | undefined
  getLedgerForDebate: (debateId: string) => LedgerEntry[]
  getUserPledges: () => LedgerEntry[]
  resetStore: () => void
  followUser: (target: string) => Promise<void>
  unfollowUser: (target: string) => Promise<void>
  getFollowers: (target: string) => string[]
  getFollowing: (username: string) => string[]
  purchaseItem: (itemId: string) => Promise<void>
  equipItem: (itemId: string) => Promise<void>
  unequipCategory: (category: ShopCategory) => Promise<void>
  loadMarkets: () => Promise<void>
  loadUserData: (userId: string) => Promise<void>
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

// DB row → Debate 변환
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDebate(row: any): Debate {
  return withMetrics({
    id: row.id,
    topic: row.topic,
    description: row.description ?? '',
    type: row.type as 'binary' | 'multi',
    owner: row.owner,
    sideA_name: row.side_a_name ?? '',
    sideB_name: row.side_b_name ?? '',
    sideA_pool: row.side_a_pool ?? 0,
    sideB_pool: row.side_b_pool ?? 0,
    options: row.options ?? undefined,
    status: row.status as DebateStatus,
    resolvedSide: row.resolved_side ?? null,
    resolvedOptionId: row.resolved_option_id ?? null,
    category: row.category ?? '',
    ticker: row.ticker ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    resolvesAt: new Date(row.resolves_at).getTime(),
  })
}

const INITIAL_STATE = {
  currentUser: { isLoggedIn:false, username:'', winRate:0, totalPnL:0 } as CurrentUser,
  walletBalance: 5000,
  debates: [] as Debate[],
  ledger: [] as LedgerEntry[],
  positions: {} as Record<string, PledgePosition>,
  customization: { ownedItemIds:[], ownedItemExpiry:{}, equippedFrame:null, equippedBadge:null, equippedTheme:null } as ProfileCustomization,
  lastDailyRewardAt: null as number | null,
  registeredUsers: {} as Record<string, string>,
  follows: {} as Record<string, string[]>,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const usePledgeStore = create<PledgeStore>()(persist((set: any, get: any) => ({
  ...INITIAL_STATE,

  loadMarkets: async () => {
    const { data, error } = await supabase.from('markets').select('*').order('created_at', { ascending: false })
    if (error || !data) return
    set({ debates: data.map(rowToDebate) })
  },

  loadUserData: async (userId: string) => {
    // 유저 베팅 내역
    const { data: bets } = await supabase.from('bets').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (bets) {
      const ledger: LedgerEntry[] = bets.map(b => ({
        id: b.id, timestamp: new Date(b.created_at).getTime(),
        debateId: b.market_id, debateTopic: '',
        action: b.action as LedgerActionType, side: b.side,
        amount: b.amount, balanceBefore: b.balance_before ?? 0,
        balanceAfter: b.balance_after ?? 0, logitAtAction: 0, impliedProbAtAction: 0,
      }))
      const positions: Record<string, PledgePosition> = {}
      bets.filter(b => b.action === 'PLEDGE').forEach(b => {
        const key = `${b.market_id}_${b.side}`
        if (!positions[key]) positions[key] = { debateId: b.market_id, side: b.side, totalPledged: 0, entries: 0 }
        positions[key].totalPledged += b.amount
        positions[key].entries += 1
      })
      set({ ledger, positions })
    }
    // 팔로우
    const { data: followData } = await supabase.from('follows').select('following').eq('follower', get().currentUser.username)
    if (followData) {
      const me = get().currentUser.username
      set((s: typeof INITIAL_STATE) => ({ follows: { ...s.follows, [me]: followData.map(f => f.following) } }))
    }
    // 아이템
    const { data: items } = await supabase.from('user_items').select('*').eq('user_id', userId)
    if (items) {
      const ownedItemIds = items.map(i => i.item_id)
      const ownedItemExpiry: Record<string, number> = {}
      items.forEach(i => { if (i.expires_at) ownedItemExpiry[i.item_id] = new Date(i.expires_at).getTime() })
      set((s: typeof INITIAL_STATE) => ({ customization: { ...s.customization, ownedItemIds, ownedItemExpiry } }))
    }
  },

  makePledge: async (debateId, side, amount) => {
    const state = get()
    const debate = state.debates.find((d: Debate) => d.id===debateId)
    if (!debate) throw new Error(`Debate ${debateId} not found`)
    if (debate.status!=='live') throw new Error('Debate is not live')
    if (amount<=0) throw new Error('Amount must be positive')
    if (amount>state.walletBalance) throw new Error('Insufficient balance')

    const balanceBefore = state.walletBalance
    const balanceAfter = balanceBefore - amount
    const posKey = `${debateId}_${side}`
    const entryId = generateId()

    // Supabase에 베팅 저장
    if (state.currentUser.userId) {
      await supabase.from('bets').insert({
        id: entryId,
        user_id: state.currentUser.userId,
        username: state.currentUser.username,
        market_id: debateId,
        side, amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        action: 'PLEDGE',
      })
      // 마켓 풀 업데이트
      if (debate.type === 'multi') {
        const newOptions = debate.options!.map(o => o.id===side ? {...o, pool: o.pool+amount} : o)
        await supabase.from('markets').update({ options: newOptions }).eq('id', debateId)
      } else {
        const updateField = side==='A' ? { side_a_pool: debate.sideA_pool+amount } : { side_b_pool: debate.sideB_pool+amount }
        await supabase.from('markets').update(updateField).eq('id', debateId)
      }
      // 지갑 잔액 업데이트
      await supabase.from('profiles').update({ wallet_balance: balanceAfter }).eq('id', state.currentUser.userId)
    }

    // 로컬 상태 업데이트
    if (debate.type==='multi') {
      const newOptions = debate.options!.map(o => o.id===side ? {...o, pool: o.pool+amount} : o)
      const impliedProb = debate.options!.reduce((a,o)=>a+o.pool,0) > 0 ? (debate.options!.find(o=>o.id===side)?.pool??0)/debate.options!.reduce((a,o)=>a+o.pool,0) : 1/debate.options!.length
      const entry: LedgerEntry = { id:entryId, timestamp:now(), debateId, debateTopic:debate.topic, action:'PLEDGE', side, amount, balanceBefore, balanceAfter, logitAtAction:0, impliedProbAtAction:impliedProb }
      set((s: typeof INITIAL_STATE & { debates: Debate[]; ledger: LedgerEntry[]; positions: Record<string, PledgePosition>; currentUser: CurrentUser }) => {
        const newDebates = s.debates.map(d => d.id!==debateId ? d : {...d, options:newOptions, metrics:calcMarketMetrics(newOptions.reduce((a,o)=>a+o.pool,0),0)})
        const existing = s.positions[posKey]
        const newPositions = {...s.positions, [posKey]: existing ? {...existing, totalPledged:existing.totalPledged+amount, entries:existing.entries+1} : {debateId, side, totalPledged:amount, entries:1}}
        const newLedger = [entry, ...s.ledger]
        return { walletBalance:balanceAfter, debates:newDebates, ledger:newLedger, positions:newPositions, currentUser:{...s.currentUser, ...deriveUserStats(newLedger)} }
      })
      return
    }
    const snap = calcMarketMetrics(debate.sideA_pool, debate.sideB_pool)
    const entry: LedgerEntry = { id:entryId, timestamp:now(), debateId, debateTopic:debate.topic, action:'PLEDGE', side, amount, balanceBefore, balanceAfter, logitAtAction:snap.logitOdds, impliedProbAtAction:side==='A'?snap.impliedProbA:snap.impliedProbB }
    set((s: typeof INITIAL_STATE & { debates: Debate[]; ledger: LedgerEntry[]; positions: Record<string, PledgePosition>; currentUser: CurrentUser }) => {
      const newDebates = s.debates.map(d => { if (d.id!==debateId) return d; const newA = side==='A'?d.sideA_pool+amount:d.sideA_pool; const newB = side==='B'?d.sideB_pool+amount:d.sideB_pool; return {...d, sideA_pool:newA, sideB_pool:newB, metrics:calcMarketMetrics(newA,newB)} })
      const existing = s.positions[posKey]
      const newPositions = {...s.positions, [posKey]: existing ? {...existing, totalPledged:existing.totalPledged+amount, entries:existing.entries+1} : {debateId, side, totalPledged:amount, entries:1}}
      const newLedger = [entry, ...s.ledger]
      return { walletBalance:balanceAfter, debates:newDebates, ledger:newLedger, positions:newPositions, currentUser:{...s.currentUser, ...deriveUserStats(newLedger)} }
    })
  },

  createDebate: async (topic, description, sideA, sideB, category, initialPledge, durationDays=30) => {
    const state = get()
    if (initialPledge<=0) throw new Error('Initial pledge must be positive')
    if (initialPledge>state.walletBalance) throw new Error('Insufficient balance')
    const half = Math.floor(initialPledge/2)
    const id = `debate-${generateId()}`
    const resolvesAt = new Date(now()+DAY_MS*durationDays)
    const newDebate = withMetrics({ id, topic, description, type:'binary', sideA_name:sideA, sideB_name:sideB, sideA_pool:half, sideB_pool:initialPledge-half, status:'live', resolvedSide:null, category, createdAt:now(), resolvesAt:resolvesAt.getTime() })

    if (state.currentUser.userId) {
      await supabase.from('markets').insert({
        id, topic, description, type:'binary', owner:state.currentUser.username,
        side_a_name:sideA, side_b_name:sideB, side_a_pool:half, side_b_pool:initialPledge-half,
        status:'live', category, resolves_at:resolvesAt.toISOString(),
      })
      await supabase.from('profiles').update({ wallet_balance: state.walletBalance-initialPledge }).eq('id', state.currentUser.userId)
    }

    const snap = calcMarketMetrics(half, initialPledge-half)
    const entry: LedgerEntry = { id:generateId(), timestamp:now(), debateId:id, debateTopic:topic, action:'PLEDGE', side:null, amount:initialPledge, balanceBefore:state.walletBalance, balanceAfter:state.walletBalance-initialPledge, logitAtAction:snap.logitOdds, impliedProbAtAction:0.5 }
    set((s: typeof INITIAL_STATE & { debates: Debate[]; ledger: LedgerEntry[]; currentUser: CurrentUser }) => { const newLedger=[entry,...s.ledger]; return { debates:[newDebate,...s.debates], walletBalance:s.walletBalance-initialPledge, ledger:newLedger, currentUser:{...s.currentUser,...deriveUserStats(newLedger)} } })
  },

  createMultiDebate: async (topic, description, category, options, initialPledge, durationDays=30) => {
    const state = get()
    if (initialPledge<=0) throw new Error('Initial pledge must be positive')
    if (initialPledge>state.walletBalance) throw new Error('Insufficient balance')
    if (options.length<2) throw new Error('Need at least 2 options')
    const perOption = Math.floor(initialPledge/options.length)
    const multiOptions = options.map((o,i) => ({ id:`opt-${i}-${generateId()}`, name:o.name, pool:i===options.length-1?initialPledge-(perOption*(options.length-1)):perOption }))
    const id = `debate-${generateId()}`
    const resolvesAt = new Date(now()+DAY_MS*durationDays)
    const newDebate = withMetrics({ id, topic, description, type:'multi', sideA_name:'', sideB_name:'', sideA_pool:0, sideB_pool:0, options:multiOptions, status:'live', resolvedSide:null, resolvedOptionId:null, category, createdAt:now(), resolvesAt:resolvesAt.getTime() })

    if (state.currentUser.userId) {
      await supabase.from('markets').insert({
        id, topic, description, type:'multi', owner:state.currentUser.username,
        side_a_name:'', side_b_name:'', side_a_pool:0, side_b_pool:0,
        options:multiOptions, status:'live', category, resolves_at:resolvesAt.toISOString(),
      })
      await supabase.from('profiles').update({ wallet_balance: state.walletBalance-initialPledge }).eq('id', state.currentUser.userId)
    }

    const entry: LedgerEntry = { id:generateId(), timestamp:now(), debateId:id, debateTopic:topic, action:'PLEDGE', side:null, amount:initialPledge, balanceBefore:state.walletBalance, balanceAfter:state.walletBalance-initialPledge, logitAtAction:0, impliedProbAtAction:0 }
    set((s: typeof INITIAL_STATE & { debates: Debate[]; ledger: LedgerEntry[]; currentUser: CurrentUser }) => { const newLedger=[entry,...s.ledger]; return { debates:[newDebate,...s.debates], walletBalance:s.walletBalance-initialPledge, ledger:newLedger, currentUser:{...s.currentUser,...deriveUserStats(newLedger)} } })
  },

  resolveDebate: async (debateId, winningSide) => {
    const state = get()
    const debate = state.debates.find((d: Debate) => d.id===debateId)
    if (!debate||debate.status!=='live') return
    const winPos = state.positions[`${debateId}_${winningSide}`]

    await supabase.from('markets').update({ status:'resolved', resolved_side:winningSide }).eq('id', debateId)

    set((s: typeof INITIAL_STATE & { debates: Debate[]; walletBalance: number; ledger: LedgerEntry[]; currentUser: CurrentUser }) => {
      const newDebates = s.debates.map((d: Debate) => d.id===debateId?{...d, status:'resolved' as const, resolvedSide:winningSide}:d)
      if (!winPos||winPos.totalPledged<=0) return { debates:newDebates }
      const metrics = calcMarketMetrics(debate.sideA_pool, debate.sideB_pool)
      const mul = winningSide==='A'?metrics.payoutMultiplierA:metrics.payoutMultiplierB
      const payout = Math.floor(winPos.totalPledged*mul)
      const entry: LedgerEntry = { id:generateId(), timestamp:now(), debateId, debateTopic:debate.topic, action:'PAYOUT', side:winningSide, amount:payout, balanceBefore:s.walletBalance, balanceAfter:s.walletBalance+payout, logitAtAction:metrics.logitOdds, impliedProbAtAction:winningSide==='A'?metrics.impliedProbA:metrics.impliedProbB }
      const newLedger=[entry,...s.ledger]
      return { debates:newDebates, walletBalance:s.walletBalance+payout, ledger:newLedger, currentUser:{...s.currentUser,...deriveUserStats(newLedger)} }
    })
  },

  cancelDebate: async (debateId) => {
    const state = get()
    const debate = state.debates.find((d: Debate) => d.id===debateId)
    if (!debate||debate.status!=='live') return
    const totalRefund = (['A','B'] as Side[]).reduce((acc,s) => acc+(state.positions[`${debateId}_${s}`]?.totalPledged??0), 0)

    await supabase.from('markets').update({ status:'cancelled' }).eq('id', debateId)

    set((s: typeof INITIAL_STATE & { debates: Debate[]; walletBalance: number; ledger: LedgerEntry[]; currentUser: CurrentUser }) => {
      const newDebates = s.debates.map((d: Debate) => d.id===debateId?{...d, status:'cancelled' as const}:d)
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
    set((s: typeof INITIAL_STATE) => ({ walletBalance:s.walletBalance+200, lastDailyRewardAt:now() }))
    return true
  },

  login: async (username, password) => {
    if (!username.trim()) return false
    // 관리자 계정
    if (username==='cjdmadldpdy123' && password==='dnjsanrhk1!') {
      const email = 'cjdmadldpdy123@futuring-user.com'
      let userId = ''
      const { data: signInData } = await supabase.auth.signInWithPassword({ email, password })
      if (signInData.user) {
        userId = signInData.user.id
      } else {
        const { data: signUpData } = await supabase.auth.signUp({ email, password })
        if (signUpData.user) {
          userId = signUpData.user.id
          await supabase.from('profiles').upsert({ id:userId, username, is_admin:true, wallet_balance:5000 })
        }
      }
      set((s: typeof INITIAL_STATE) => ({ currentUser:{...s.currentUser, isLoggedIn:true, username, isAdmin:true, userId} }))
      if (userId) await get().loadUserData(userId)
      return true
    }
    // 일반 유저
    const email = `${username}@futuring-user.com`
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) return false
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    if (!profile) return false
    set({ currentUser: { isLoggedIn:true, username:profile.username, winRate:profile.win_rate??0, totalPnL:profile.total_pnl??0, isAdmin:profile.is_admin??false, userId:data.user.id }, walletBalance: profile.wallet_balance??5000 })
    await get().loadUserData(data.user.id)
    return true
  },

  signup: async (username, password) => {
    if (!username.trim()||!password.trim()) return false
    if (username==='cjdmadldpdy123') return false
    const email = `${username}@futuring-user.com`
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error || !data.user) return false
    const { error: profileError } = await supabase.from('profiles').insert({ id:data.user.id, username, is_admin:false, wallet_balance:5000 })
    if (profileError) return false
    return true
  },

  logout: async () => {
    await supabase.auth.signOut()
    set(() => ({ currentUser: { isLoggedIn:false, username:'', winRate:0, totalPnL:0 }, walletBalance:5000, ledger:[], positions:{}, follows:{} }))
  },

  setUsername: (username) => set((s: typeof INITIAL_STATE) => ({ currentUser:{...s.currentUser, username} })),
  getDebate: (debateId) => get().debates.find((d: Debate) => d.id===debateId),
  getPosition: (debateId, side) => get().positions[`${debateId}_${side}`],
  getLedgerForDebate: (debateId) => get().ledger.filter((e: LedgerEntry) => e.debateId===debateId),
  getUserPledges: () => get().ledger,
  resetStore: () => set(() => ({...INITIAL_STATE})),
  addDemoPoints: (amount) => set((s: typeof INITIAL_STATE) => ({ walletBalance:s.walletBalance+amount })),

  followUser: async (target) => {
    const me = get().currentUser.username
    if (!me || me===target) return
    await supabase.from('follows').insert({ follower:me, following:target }).then(() => {})
    set((s: typeof INITIAL_STATE) => {
      const cur = s.follows[me] ?? []
      if (cur.includes(target)) return s
      return { follows: {...s.follows, [me]: [...cur, target]} }
    })
  },

  unfollowUser: async (target) => {
    const me = get().currentUser.username
    if (!me) return
    await supabase.from('follows').delete().eq('follower', me).eq('following', target)
    set((s: typeof INITIAL_STATE) => ({ follows: {...s.follows, [me]: (s.follows[me]??[]).filter((u: string)=>u!==target)} }))
  },

  getFollowers: (target) => {
    const s = usePledgeStore.getState()
    return Object.entries(s.follows as Record<string,string[]>).filter(([,fl])=>(fl as string[]).includes(target)).map(([u])=>u)
  },
  getFollowing: (username) => usePledgeStore.getState().follows[username] ?? [],

  purchaseItem: async (itemId) => {
    const state = get()
    const item = SHOP_ITEMS.find(i => i.id===itemId)
    if (!item||state.customization.ownedItemIds.includes(itemId)||item.price>state.walletBalance) return
    const expiresAt = item.durationDays ? new Date(now()+item.durationDays*DAY_MS).toISOString() : null
    if (state.currentUser.userId) {
      await supabase.from('user_items').insert({ id:generateId(), user_id:state.currentUser.userId, item_id:itemId, expires_at:expiresAt })
      await supabase.from('profiles').update({ wallet_balance: state.walletBalance-item.price }).eq('id', state.currentUser.userId)
    }
    set((s: typeof INITIAL_STATE) => ({
      walletBalance:s.walletBalance-item.price,
      customization:{...s.customization, ownedItemIds:[...s.customization.ownedItemIds, itemId], ownedItemExpiry:expiresAt?{...s.customization.ownedItemExpiry,[itemId]:new Date(expiresAt).getTime()}:s.customization.ownedItemExpiry}
    }))
  },

  equipItem: async (itemId) => {
    const item = SHOP_ITEMS.find(i => i.id===itemId)
    if (!item) return
    const cust = get().customization
    if (!cust.ownedItemIds.includes(itemId)) return
    const expiry = cust.ownedItemExpiry[itemId]
    if (expiry&&expiry<now()) return
    if (get().currentUser.userId) {
      const updateData: Record<string, string | null> = {}
      if (item.category==='frame') updateData.equipped_frame = itemId
      if (item.category==='badge') updateData.equipped_badge = itemId
      if (item.category==='theme') updateData.equipped_theme = itemId
      await supabase.from('profiles').update(updateData).eq('id', get().currentUser.userId)
    }
    set((s: typeof INITIAL_STATE) => ({ customization:{...s.customization, equippedFrame:item.category==='frame'?itemId:s.customization.equippedFrame, equippedBadge:item.category==='badge'?itemId:s.customization.equippedBadge, equippedTheme:item.category==='theme'?itemId:s.customization.equippedTheme} }))
  },

  unequipCategory: async (category) => {
    if (get().currentUser.userId) {
      const updateData: Record<string, null> = {}
      if (category==='frame') updateData.equipped_frame = null
      if (category==='badge') updateData.equipped_badge = null
      if (category==='theme') updateData.equipped_theme = null
      await supabase.from('profiles').update(updateData).eq('id', get().currentUser.userId)
    }
    set((s: typeof INITIAL_STATE) => ({ customization:{...s.customization, equippedFrame:category==='frame'?null:s.customization.equippedFrame, equippedBadge:category==='badge'?null:s.customization.equippedBadge, equippedTheme:category==='theme'?null:s.customization.equippedTheme} }))
  },
}), {
  name: 'futuring-store-v3',
  version: 7,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: (persistedState: any, version: number): any => {
    const state = persistedState as Record<string, unknown>
    const result = {...state}
    if (version<2) { result.lastDailyRewardAt=null; result.customization={ownedItemIds:[],ownedItemExpiry:{},equippedFrame:null,equippedBadge:null,equippedTheme:null} }
    if (version<3) { const debates=(state.debates as Debate[]|undefined)??[]; result.debates=debates.map(d => ({...d, type:d.type??'binary'})) }
    if (version<4) { result.registeredUsers={} }
    if (version<5) { result.whaleBattles=[] }
    if (version<7) { result.debates=[] }
    return result
  },
}))

export const selectLiveDebates = (s: PledgeStore) => s.debates.filter(d => d.status==='live')
export const selectMarginalImpact = (id: string, side: Side, amount: number) => (s: PledgeStore) => {
  const d = s.debates.find(x => x.id===id)
  if (!d||d.type==='multi') return 0
  return calcMarginalImpact(d.sideA_pool, d.sideB_pool, side as 'A' | 'B', amount)
}
