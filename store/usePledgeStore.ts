import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calcMarketMetrics, calcMarginalImpact, type MarketMetrics } from '@/lib/marketMath'
import { SHOP_ITEMS, type ShopCategory } from '@/lib/shopItems'
import { supabase } from '@/lib/supabase'
import { createNotification } from '@/lib/notifications'

export type Side = string
export type DebateStatus = 'live' | 'pending_resolution' | 'resolved' | 'cancelled'

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

// LP
export interface LpPosition {
  id: string; poolId: string; amount: number; createdAt: number
}

// 고래 배틀
export interface WhaleBattle {
  id: string; challenger: string; challengerColor: string; challengerBadge: string
  defender: string; defenderColor: string; defenderBadge: string
  condition: string; duration: number; startAt: number; endAt: number
  prize: number; status: 'pending' | 'live' | 'ended'; poolFor: number; poolAgainst: number
  winnerId?: string | null
}

// 경매
export interface AuctionItem {
  id: string; title: string; desc: string
  endAt: number; topBid: number; topBidder: string; minInc: number; status: string
}

// 현상금
export interface Bounty {
  id: string; topic: string; reward: number; sponsor: string
  condition: string; deadline: number; participants: number; status: string
  winnerId?: string | null; marketId?: string | null
}

// 북마크
export interface Bookmark { marketId: string; createdAt: number }

// 관리자 경제 설정
export interface EconomySettings {
  dailyReward: number
  houseEdge: number
  maxBetPct: number
  decayRate: number
  burnRate: number
}

interface PledgeStore {
  currentUser: CurrentUser; walletBalance: number; debates: Debate[]
  ledger: LedgerEntry[]; positions: Record<string, PledgePosition>
  customization: ProfileCustomization; lastDailyRewardAt: number | null
  registeredUsers: Record<string, string>
  follows: Record<string, string[]>
  lpPositions: LpPosition[]
  whaleBattles: WhaleBattle[]
  auctions: AuctionItem[]
  bounties: Bounty[]
  economySettings: EconomySettings

  makePledge: (debateId: string, side: Side, amount: number) => Promise<void>
  createDebate: (topic: string, description: string, sideA: string, sideB: string, category: string, initialPledge: number, durationDays?: number) => Promise<void>
  createMultiDebate: (topic: string, description: string, category: string, options: { name: string }[], initialPledge: number, durationDays?: number) => Promise<void>
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
  // LP
  depositLp: (poolId: string, amount: number) => Promise<void>
  withdrawLp: (positionId: string) => Promise<void>
  loadLpPositions: () => Promise<void>
  // 고래 배틀
  loadWhaleBattles: () => Promise<void>
  createWhaleBattle: (defender: string, condition: string, duration: number, prize: number) => Promise<void>
  betOnBattle: (battleId: string, side: 'challenger' | 'defender', amount: number) => Promise<void>
  resolveBattle: (battleId: string, winnerId: string) => Promise<void>
  // 경매
  loadAuctions: () => Promise<void>
  placeBid: (auctionId: string, amount: number) => Promise<void>
  // 현상금
  loadBounties: () => Promise<void>
  participateBounty: (bountyId: string) => Promise<void>
  createBounty: (topic: string, reward: number, condition: string, durationDays: number, marketId?: string) => Promise<void>
  resolveBounty: (bountyId: string, winnerUsername: string) => Promise<void>
  bookmarks: Bookmark[]
  toggleBookmark: (marketId: string) => Promise<void>
  loadBookmarks: () => Promise<void>
  isBookmarked: (marketId: string) => boolean
  // 관리자
  saveEconomySettings: (settings: EconomySettings) => Promise<void>
  adminAddPoints: (targetUsername: string, amount: number) => Promise<boolean>
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

const DEFAULT_ECONOMY: EconomySettings = {
  dailyReward: 200,
  houseEdge: 2,
  maxBetPct: 50,
  decayRate: 1,
  burnRate: 5,
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
  lpPositions: [] as LpPosition[],
  whaleBattles: [] as WhaleBattle[],
  auctions: [] as AuctionItem[],
  bounties: [] as Bounty[],
  economySettings: DEFAULT_ECONOMY,
  bookmarks: [] as Bookmark[],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const usePledgeStore = create<PledgeStore>()(persist((set: any, get: any) => ({
  ...INITIAL_STATE,

  loadMarkets: async () => {
    const { data, error } = await supabase.from('markets').select('*').order('created_at', { ascending: false })
    if (error || !data) return
    const debates = data.map(rowToDebate)
    set({ debates })
    // 마감 시간 지난 live 마켓 자동으로 pending_resolution 전환
    const expired = debates.filter((d: Debate) => d.status === 'live' && d.resolvesAt < Date.now())
    for (const d of expired) {
      await supabase.from('markets').update({ status: 'pending_resolution' }).eq('id', d.id)
    }
    if (expired.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set((s: any) => ({
        debates: s.debates.map((d: Debate) =>
          expired.find((e: Debate) => e.id === d.id) ? { ...d, status: 'pending_resolution' as DebateStatus } : d
        ),
      }))
    }
  },

  loadUserData: async (userId: string) => {
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
    const { data: followData } = await supabase.from('follows').select('following').eq('follower', get().currentUser.username)
    if (followData) {
      const me = get().currentUser.username
      set((s: typeof INITIAL_STATE) => ({ follows: { ...s.follows, [me]: followData.map((f: { following: string }) => f.following) } }))
    }
    const { data: items } = await supabase.from('user_items').select('*').eq('user_id', userId)
    if (items) {
      const ownedItemIds = items.map((i: { item_id: string }) => i.item_id)
      const ownedItemExpiry: Record<string, number> = {}
      items.forEach((i: { item_id: string; expires_at: string | null }) => { if (i.expires_at) ownedItemExpiry[i.item_id] = new Date(i.expires_at).getTime() })
      set((s: typeof INITIAL_STATE) => ({ customization: { ...s.customization, ownedItemIds, ownedItemExpiry } }))
    }
    // LP 포지션 로드
    await get().loadLpPositions()
    // 배틀, 경매, 현상금 로드
    await get().loadWhaleBattles()
    await get().loadAuctions()
    await get().loadBounties()
    // 경제 설정 로드
    const { data: econRow } = await supabase.from('economy_settings').select('*').eq('id', 'global').maybeSingle()
    if (econRow) {
      set({ economySettings: {
        dailyReward: econRow.daily_reward ?? 200,
        houseEdge: econRow.house_edge ?? 2,
        maxBetPct: econRow.max_bet_pct ?? 50,
        decayRate: econRow.decay_rate ?? 1,
        burnRate: econRow.burn_rate ?? 5,
      }})
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

    // 첫 베팅이면 마켓 주인에게 알림
    if (state.currentUser.userId && debate.owner && debate.owner !== state.currentUser.username) {
      const pledgesOnDebate = state.ledger.filter((e: LedgerEntry) => e.debateId === debateId && e.action === 'PLEDGE').length
      if (pledgesOnDebate === 0) {
        const { data: ownerProfile } = await supabase.from('profiles').select('id').eq('username', debate.owner).single()
        if (ownerProfile) {
          await createNotification(ownerProfile.id, 'first_bet', '🎯 첫 베팅 발생!', `${debate.topic}에 첫 베팅이 들어왔어요!`, `/market/${debateId}`)
        }
      }
    }
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
      if (debate.type === 'multi') {
        const newOptions = debate.options!.map(o => o.id===side ? {...o, pool: o.pool+amount} : o)
        await supabase.from('markets').update({ options: newOptions }).eq('id', debateId)
      } else {
        const updateField = side==='A' ? { side_a_pool: debate.sideA_pool+amount } : { side_b_pool: debate.sideB_pool+amount }
        await supabase.from('markets').update(updateField).eq('id', debateId)
      }
      await supabase.from('profiles').update({ wallet_balance: balanceAfter }).eq('id', state.currentUser.userId)
    }

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

  // ── 마켓 판정: 모든 베터에게 정산 ──────────────────────────────
  resolveDebate: async (debateId, winningSide) => {
    const state = get()
    const debate = state.debates.find((d: Debate) => d.id===debateId)
    if (!debate||(debate.status!=='live'&&debate.status!=='pending_resolution')) return

    // Supabase에서 해당 마켓의 모든 PLEDGE 베팅 조회
    const { data: allBets } = await supabase
      .from('bets')
      .select('*')
      .eq('market_id', debateId)
      .eq('action', 'PLEDGE')

    // 마켓 상태 업데이트
    await supabase.from('markets').update({ status:'resolved', resolved_side:winningSide }).eq('id', debateId)

    if (allBets && allBets.length > 0) {
      // 승리측 총 풀 계산
      const winBets = allBets.filter((b: { side: string }) => b.side === winningSide)
      const loseBets = allBets.filter((b: { side: string }) => b.side !== winningSide)
      const winPool = winBets.reduce((s: number, b: { amount: number }) => s + b.amount, 0)
      const losePool = loseBets.reduce((s: number, b: { amount: number }) => s + b.amount, 0)
      const totalPool = winPool + losePool

      if (winPool > 0) {
        // 각 승리 베터에게 정산
        for (const bet of winBets) {
          const payout = Math.floor((bet.amount / winPool) * totalPool)
          // 해당 유저의 현재 잔액 조회
          const { data: profile } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', bet.user_id)
            .single()
          if (profile) {
            const newBalance = profile.wallet_balance + payout
            await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', bet.user_id)
            // PAYOUT 기록 삽입
            await supabase.from('bets').insert({
              id: generateId(),
              user_id: bet.user_id,
              username: bet.username,
              market_id: debateId,
              side: winningSide,
              amount: payout,
              balance_before: profile.wallet_balance,
              balance_after: newBalance,
              action: 'PAYOUT',
            })
            // 정산 알림
            await createNotification(
              bet.user_id, 'payout',
              '🎉 베팅 수익 정산',
              `${debate.topic} — +${payout.toLocaleString()}P 지급됐어요!`,
              `/market/${debateId}`
            )
          }
        }
      }
    }

    // 현재 로그인 유저 로컬 state 업데이트
    const myPosKey = `${debateId}_${winningSide}`
    const myPos = state.positions[myPosKey]
    set((s: typeof INITIAL_STATE & { debates: Debate[]; walletBalance: number; ledger: LedgerEntry[]; currentUser: CurrentUser; positions: Record<string, PledgePosition> }) => {
      const newDebates = s.debates.map((d: Debate) => d.id===debateId?{...d, status:'resolved' as const, resolvedSide:winningSide}:d)
      if (!myPos||myPos.totalPledged<=0) return { debates:newDebates }
      const metrics = calcMarketMetrics(debate.sideA_pool, debate.sideB_pool)
      const winPool = (debate.type==='binary' ? (winningSide==='A'?debate.sideA_pool:debate.sideB_pool) : (debate.options?.find(o=>o.id===winningSide)?.pool??0))
      const totalPool = debate.metrics.totalPool
      const payout = winPool > 0 ? Math.floor((myPos.totalPledged / winPool) * totalPool) : 0
      const entry: LedgerEntry = { id:generateId(), timestamp:now(), debateId, debateTopic:debate.topic, action:'PAYOUT', side:winningSide, amount:payout, balanceBefore:s.walletBalance, balanceAfter:s.walletBalance+payout, logitAtAction:metrics.logitOdds, impliedProbAtAction:winningSide==='A'?metrics.impliedProbA:metrics.impliedProbB }
      const newLedger=[entry,...s.ledger]
      return { debates:newDebates, walletBalance:s.walletBalance+payout, ledger:newLedger, currentUser:{...s.currentUser,...deriveUserStats(newLedger)} }
    })
  },

  // ── 마켓 취소: 모든 베터에게 환불 ──────────────────────────────
  cancelDebate: async (debateId) => {
    const state = get()
    const debate = state.debates.find((d: Debate) => d.id===debateId)
    if (!debate||(debate.status!=='live'&&debate.status!=='pending_resolution')) return

    const { data: allBets } = await supabase
      .from('bets')
      .select('*')
      .eq('market_id', debateId)
      .eq('action', 'PLEDGE')

    await supabase.from('markets').update({ status:'cancelled' }).eq('id', debateId)

    if (allBets && allBets.length > 0) {
      for (const bet of allBets) {
        const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', bet.user_id).single()
        if (profile) {
          const newBalance = profile.wallet_balance + bet.amount
          await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', bet.user_id)
          await supabase.from('bets').insert({
            id: generateId(), user_id: bet.user_id, username: bet.username,
            market_id: debateId, side: bet.side, amount: bet.amount,
            balance_before: profile.wallet_balance, balance_after: newBalance, action: 'REFUND',
          })
          // 환불 알림
          await createNotification(
            bet.user_id, 'cancel',
            '↩️ 마켓 취소 환불',
            `${debate.topic} — ${bet.amount.toLocaleString()}P 환불됐어요.`,
            `/market/${debateId}`
          )
        }
      }
    }

    // 로컬 state 업데이트
    const myBetsForDebate = (Object.values(state.positions) as PledgePosition[]).filter((p: PledgePosition) => p.debateId === debateId)
    const totalMyRefund = myBetsForDebate.reduce((s: number, p: PledgePosition) => s + (p.totalPledged as number), 0)
    set((s: typeof INITIAL_STATE & { debates: Debate[]; walletBalance: number; ledger: LedgerEntry[]; currentUser: CurrentUser }) => {
      const newDebates = s.debates.map((d: Debate) => d.id===debateId?{...d, status:'cancelled' as const}:d)
      if (totalMyRefund<=0) return { debates:newDebates }
      const entry: LedgerEntry = { id:generateId(), timestamp:now(), debateId, debateTopic:debate.topic, action:'REFUND', side:null, amount:totalMyRefund, balanceBefore:s.walletBalance, balanceAfter:s.walletBalance+totalMyRefund, logitAtAction:0, impliedProbAtAction:0.5 }
      const newLedger=[entry,...s.ledger]
      return { debates:newDebates, walletBalance:s.walletBalance+totalMyRefund, ledger:newLedger, currentUser:{...s.currentUser,...deriveUserStats(newLedger)} }
    })
  },

  claimDailyReward: () => {
    const state = get()
    const lastClaim = state.lastDailyRewardAt
    const reward = state.economySettings.dailyReward
    if (lastClaim && (now()-lastClaim) < DAY_MS) return false
    const newBalance = state.walletBalance + reward
    if (state.currentUser.userId) {
      supabase.from('profiles').update({ wallet_balance: newBalance, last_daily_reward_at: new Date().toISOString() }).eq('id', state.currentUser.userId)
    }
    set((s: typeof INITIAL_STATE) => ({ walletBalance: s.walletBalance + reward, lastDailyRewardAt: now() }))
    return true
  },

  login: async (username, password) => {
    if (!username.trim()) return false
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
      const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single()
      set((s: typeof INITIAL_STATE) => ({ currentUser:{...s.currentUser, isLoggedIn:true, username, isAdmin:true, userId}, walletBalance: profile?.wallet_balance ?? s.walletBalance }))
      if (userId) await get().loadUserData(userId)
      return true
    }
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
    set(() => ({ currentUser: { isLoggedIn:false, username:'', winRate:0, totalPnL:0 }, walletBalance:5000, ledger:[], positions:{}, follows:{}, lpPositions:[], whaleBattles:[], auctions:[], bounties:[], bookmarks:[] }))
  },

  setUsername: (username) => set((s: typeof INITIAL_STATE) => ({ currentUser:{...s.currentUser, username} })),
  getDebate: (debateId) => get().debates.find((d: Debate) => d.id===debateId),
  getPosition: (debateId, side) => get().positions[`${debateId}_${side}`],
  getLedgerForDebate: (debateId) => get().ledger.filter((e: LedgerEntry) => e.debateId===debateId),
  getUserPledges: () => get().ledger,
  resetStore: () => set(() => ({...INITIAL_STATE})),

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

  // ── LP ─────────────────────────────────────────────────────────
  loadLpPositions: async () => {
    const state = get()
    if (!state.currentUser.userId) return
    const { data } = await supabase.from('lp_positions').select('*').eq('user_id', state.currentUser.userId).order('created_at', { ascending: false })
    if (data) {
      const positions: LpPosition[] = data.map((r: { id: string; pool_id: string; amount: number; created_at: string }) => ({
        id: r.id, poolId: r.pool_id, amount: r.amount, createdAt: new Date(r.created_at).getTime()
      }))
      set({ lpPositions: positions })
    }
  },

  depositLp: async (poolId, amount) => {
    const state = get()
    if (!state.currentUser.userId) throw new Error('로그인이 필요해요')
    if (amount <= 0) throw new Error('금액을 입력해주세요')
    if (amount > state.walletBalance) throw new Error('잔액이 부족해요')
    const id = generateId()
    const newBalance = state.walletBalance - amount
    await supabase.from('lp_positions').insert({
      id, user_id: state.currentUser.userId, pool_id: poolId, amount,
    })
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', state.currentUser.userId)
    const newPos: LpPosition = { id, poolId, amount, createdAt: now() }
    set((s: typeof INITIAL_STATE & { lpPositions: LpPosition[] }) => ({
      walletBalance: newBalance,
      lpPositions: [newPos, ...s.lpPositions],
    }))
  },

  withdrawLp: async (positionId) => {
    const state = get()
    const pos = state.lpPositions.find((p: LpPosition) => p.id === positionId)
    if (!pos || !state.currentUser.userId) return
    // APY 계산: 예치 기간에 따른 수익 적용
    const pool = LP_POOLS.find(p => p.id === pos.poolId)
    const apy = pool?.apy ?? 10
    const elapsedDays = (now() - pos.createdAt) / DAY_MS
    const profit = Math.floor(pos.amount * (apy / 100) * (elapsedDays / 365))
    const returnAmount = pos.amount + profit
    const newBalance = state.walletBalance + returnAmount
    await supabase.from('lp_positions').delete().eq('id', positionId)
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', state.currentUser.userId)
    set((s: typeof INITIAL_STATE & { lpPositions: LpPosition[] }) => ({
      walletBalance: newBalance,
      lpPositions: s.lpPositions.filter((p: LpPosition) => p.id !== positionId),
    }))
  },

  // ── 고래 배틀 ──────────────────────────────────────────────────
  loadWhaleBattles: async () => {
    const { data } = await supabase.from('whale_battles').select('*').order('created_at', { ascending: false })
    if (data) {
      const battles: WhaleBattle[] = data.map((r: {
        id: string; challenger: string; challenger_color: string; challenger_badge: string;
        defender: string; defender_color: string; defender_badge: string;
        condition: string; duration: number; start_at: string; end_at: string;
        prize: number; status: string; pool_for: number; pool_against: number; winner_id: string | null;
      }) => ({
        id: r.id, challenger: r.challenger, challengerColor: r.challenger_color,
        challengerBadge: r.challenger_badge, defender: r.defender, defenderColor: r.defender_color,
        defenderBadge: r.defender_badge, condition: r.condition, duration: r.duration,
        startAt: new Date(r.start_at).getTime(), endAt: new Date(r.end_at).getTime(),
        prize: r.prize, status: r.status as WhaleBattle['status'],
        poolFor: r.pool_for, poolAgainst: r.pool_against, winnerId: r.winner_id,
      }))
      set({ whaleBattles: battles })
    }
  },

  createWhaleBattle: async (defender, condition, duration, prize) => {
    const state = get()
    if (!state.currentUser.isLoggedIn) throw new Error('로그인이 필요해요')
    if (prize > state.walletBalance) throw new Error('잔액이 부족해요')
    const id = generateId()
    const startAt = new Date()
    const endAt = new Date(now() + duration * 3600000)
    const challenger = state.currentUser.username
    const { error } = await supabase.from('whale_battles').insert({
      id, challenger, challenger_color: '#2563EB', challenger_badge: '🐋 웨일',
      defender, defender_color: '#10B981', defender_badge: '👤 유저',
      condition, duration, start_at: startAt.toISOString(), end_at: endAt.toISOString(),
      prize, status: 'live', pool_for: 0, pool_against: 0,
    })
    if (error) throw new Error('배틀 생성에 실패했어요')
    const newBattle: WhaleBattle = {
      id, challenger, challengerColor: '#2563EB', challengerBadge: '🐋 웨일',
      defender, defenderColor: '#10B981', defenderBadge: '👤 유저',
      condition, duration, startAt: startAt.getTime(), endAt: endAt.getTime(),
      prize, status: 'live', poolFor: 0, poolAgainst: 0,
    }
    set((s: typeof INITIAL_STATE & { whaleBattles: WhaleBattle[] }) => ({
      whaleBattles: [newBattle, ...s.whaleBattles],
    }))
  },

  betOnBattle: async (battleId, side, amount) => {
    const state = get()
    if (!state.currentUser.userId) throw new Error('로그인이 필요해요')
    if (amount > state.walletBalance) throw new Error('잔액이 부족해요')
    const newBalance = state.walletBalance - amount
    await supabase.from('whale_battle_bets').insert({
      id: generateId(), battle_id: battleId, username: state.currentUser.username, side, amount,
    })
    if (side === 'challenger') {
      const battle = state.whaleBattles.find((b: WhaleBattle) => b.id === battleId)
      if (battle) await supabase.from('whale_battles').update({ pool_for: battle.poolFor + amount }).eq('id', battleId)
    } else {
      const battle = state.whaleBattles.find((b: WhaleBattle) => b.id === battleId)
      if (battle) await supabase.from('whale_battles').update({ pool_against: battle.poolAgainst + amount }).eq('id', battleId)
    }
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', state.currentUser.userId)
    set((s: typeof INITIAL_STATE & { whaleBattles: WhaleBattle[] }) => ({
      walletBalance: newBalance,
      whaleBattles: s.whaleBattles.map((b: WhaleBattle) =>
        b.id !== battleId ? b :
        { ...b, poolFor: side==='challenger' ? b.poolFor+amount : b.poolFor, poolAgainst: side==='defender' ? b.poolAgainst+amount : b.poolAgainst }
      ),
    }))
  },

  resolveBattle: async (battleId, winnerId) => {
    const state = get()
    const battle = state.whaleBattles.find((b: WhaleBattle) => b.id === battleId)
    if (!battle || battle.status !== 'live') return

    await supabase.from('whale_battles').update({ status: 'ended', winner_id: winnerId }).eq('id', battleId)

    // 베팅자 정산
    const winSide = winnerId === battle.challenger ? 'challenger' : 'defender'
    const { data: battleBets } = await supabase.from('whale_battle_bets').select('*').eq('battle_id', battleId)
    if (battleBets && battleBets.length > 0) {
      const winBets = battleBets.filter((b: { side: string }) => b.side === winSide)
      const loseBets = battleBets.filter((b: { side: string }) => b.side !== winSide)
      const winPool = winBets.reduce((s: number, b: { amount: number }) => s + b.amount, 0)
      const losePool = loseBets.reduce((s: number, b: { amount: number }) => s + b.amount, 0)
      const totalPool = winPool + losePool
      if (winPool > 0) {
        for (const bet of winBets) {
          const { data: p } = await supabase.from('profiles').select('wallet_balance, id').eq('username', bet.username).single()
          if (p) {
            const payout = Math.floor((bet.amount / winPool) * totalPool)
            await supabase.from('profiles').update({ wallet_balance: p.wallet_balance + payout }).eq('id', p.id)
          }
        }
      }
    }

    set((s: typeof INITIAL_STATE & { whaleBattles: WhaleBattle[] }) => ({
      whaleBattles: s.whaleBattles.map((b: WhaleBattle) =>
        b.id === battleId ? { ...b, status: 'ended' as const, winnerId } : b
      ),
    }))
  },

  // ── 경매 ───────────────────────────────────────────────────────
  loadAuctions: async () => {
    const { data } = await supabase.from('auctions').select('*').order('created_at', { ascending: false })
    if (data) {
      const auctions: AuctionItem[] = data.map((r: {
        id: string; title: string; description: string; end_at: string;
        top_bid: number; top_bidder: string; min_increment: number; status: string;
      }) => ({
        id: r.id, title: r.title, desc: r.description,
        endAt: new Date(r.end_at).getTime(), topBid: r.top_bid,
        topBidder: r.top_bidder, minInc: r.min_increment, status: r.status,
      }))
      set({ auctions })
    }
  },

  placeBid: async (auctionId, amount) => {
    const state = get()
    if (!state.currentUser.userId) throw new Error('로그인이 필요해요')
    const auction = state.auctions.find((a: AuctionItem) => a.id === auctionId)
    if (!auction) throw new Error('경매를 찾을 수 없어요')
    if (amount <= auction.topBid) throw new Error('현재 입찰가보다 높아야 해요')
    if (amount > state.walletBalance) throw new Error('잔액이 부족해요')

    // 이전 최고 입찰자에게 환불 (Supabase에서 처리)
    const { data: prevBidder } = await supabase.from('profiles').select('wallet_balance, id').eq('username', auction.topBidder).single()
    if (prevBidder && auction.topBidder !== state.currentUser.username) {
      await supabase.from('profiles').update({ wallet_balance: prevBidder.wallet_balance + auction.topBid }).eq('id', prevBidder.id)
    }

    const newBalance = state.walletBalance - amount
    await supabase.from('auctions').update({ top_bid: amount, top_bidder: state.currentUser.username }).eq('id', auctionId)
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', state.currentUser.userId)

    set((s: typeof INITIAL_STATE & { auctions: AuctionItem[] }) => ({
      walletBalance: newBalance,
      auctions: s.auctions.map((a: AuctionItem) =>
        a.id === auctionId ? { ...a, topBid: amount, topBidder: state.currentUser.username } : a
      ),
    }))
  },

  // ── 현상금 ─────────────────────────────────────────────────────
  loadBounties: async () => {
    const { data } = await supabase.from('bounties').select('*').order('created_at', { ascending: false })
    if (data) {
      const bounties: Bounty[] = data.map((r: {
        id: string; topic: string; reward: number; sponsor: string;
        condition: string; deadline: string; participants: number; status: string;
        winner_id: string | null; market_id: string | null;
      }) => ({
        id: r.id, topic: r.topic, reward: r.reward, sponsor: r.sponsor,
        condition: r.condition, deadline: new Date(r.deadline).getTime(),
        participants: r.participants, status: r.status,
        winnerId: r.winner_id, marketId: r.market_id,
      }))
      set({ bounties })
    }
  },

  participateBounty: async (bountyId) => {
    const state = get()
    if (!state.currentUser.userId) throw new Error('로그인이 필요해요')
    const bounty = state.bounties.find((b: Bounty) => b.id === bountyId)
    if (!bounty || bounty.status !== 'live') throw new Error('참여 불가')
    // 참여 인원 +1
    await supabase.from('bounties').update({ participants: bounty.participants + 1 }).eq('id', bountyId)
    await supabase.from('bounty_participants').insert({ id: generateId(), bounty_id: bountyId, username: state.currentUser.username })
    set((s: typeof INITIAL_STATE & { bounties: Bounty[] }) => ({
      bounties: s.bounties.map((b: Bounty) => b.id === bountyId ? { ...b, participants: b.participants + 1 } : b),
    }))
  },

  createBounty: async (topic, reward, condition, durationDays, marketId) => {
    const state = get()
    if (!state.currentUser.isAdmin) throw new Error('관리자만 생성 가능해요')
    const id = generateId()
    const deadline = new Date(now() + durationDays * DAY_MS)
    await supabase.from('bounties').insert({
      id, topic, reward, sponsor: state.currentUser.username,
      condition, deadline: deadline.toISOString(), participants: 0,
      status: 'live', market_id: marketId ?? null,
    })
    const newBounty: Bounty = {
      id, topic, reward, sponsor: state.currentUser.username,
      condition, deadline: deadline.getTime(), participants: 0, status: 'live',
      marketId: marketId ?? null,
    }
    set((s: typeof INITIAL_STATE & { bounties: Bounty[] }) => ({
      bounties: [newBounty, ...s.bounties],
    }))
  },

  resolveBounty: async (bountyId, winnerUsername) => {
    const state = get()
    if (!state.currentUser.isAdmin) throw new Error('관리자만 판정 가능해요')
    const bounty = state.bounties.find((b: Bounty) => b.id === bountyId)
    if (!bounty || bounty.status !== 'live') return
    await supabase.from('bounties').update({ status: 'resolved', winner_id: winnerUsername }).eq('id', bountyId)
    // 당첨자에게 포인트 지급
    const { data: winner } = await supabase.from('profiles').select('wallet_balance, id').eq('username', winnerUsername).single()
    if (winner) {
      await supabase.from('profiles').update({ wallet_balance: winner.wallet_balance + bounty.reward }).eq('id', winner.id)
    }
    set((s: typeof INITIAL_STATE & { bounties: Bounty[] }) => ({
      bounties: s.bounties.map((b: Bounty) => b.id === bountyId ? { ...b, status: 'resolved', winnerId: winnerUsername } : b),
    }))
    // 만약 현재 로그인 유저가 당첨자라면 잔액 반영
    if (winnerUsername === state.currentUser.username) {
      set((s: typeof INITIAL_STATE) => ({ walletBalance: s.walletBalance + bounty.reward }))
    }
  },

  // ── 관리자 ─────────────────────────────────────────────────────
  saveEconomySettings: async (settings) => {
    await supabase.from('economy_settings').upsert({
      id: 'global',
      daily_reward: settings.dailyReward,
      house_edge: settings.houseEdge,
      max_bet_pct: settings.maxBetPct,
      decay_rate: settings.decayRate,
      burn_rate: settings.burnRate,
    })
    set({ economySettings: settings })
  },

  bookmarks: [],

  loadBookmarks: async () => {
    const state = get()
    if (!state.currentUser.userId) return
    const { data } = await supabase.from('bookmarks').select('*').eq('user_id', state.currentUser.userId)
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set({ bookmarks: data.map((r: any) => ({ marketId: r.market_id, createdAt: new Date(r.created_at).getTime() })) })
    }
  },

  toggleBookmark: async (marketId) => {
    const state = get()
    if (!state.currentUser.userId) return
    const existing = (state.bookmarks as Bookmark[]).find(b => b.marketId === marketId)
    if (existing) {
      await supabase.from('bookmarks').delete().eq('user_id', state.currentUser.userId).eq('market_id', marketId)
      set((s: typeof INITIAL_STATE & { bookmarks: Bookmark[] }) => ({ bookmarks: s.bookmarks.filter((b: Bookmark) => b.marketId !== marketId) }))
    } else {
      const id = generateId()
      await supabase.from('bookmarks').insert({ id, user_id: state.currentUser.userId, market_id: marketId })
      set((s: typeof INITIAL_STATE & { bookmarks: Bookmark[] }) => ({ bookmarks: [...s.bookmarks, { marketId, createdAt: Date.now() }] }))
    }
  },

  isBookmarked: (marketId) => {
    return !!(get().bookmarks as Bookmark[]).find(b => b.marketId === marketId)
  },

  adminAddPoints: async (targetUsername, amount) => {
    const { data: profile } = await supabase.from('profiles').select('wallet_balance, id').eq('username', targetUsername).single()
    if (!profile) return false
    const newBalance = profile.wallet_balance + amount
    const { error } = await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', profile.id)
    if (error) return false
    // 만약 현재 로그인 유저가 대상이라면 로컬 상태도 업데이트
    const state = get()
    if (state.currentUser.username === targetUsername) {
      set({ walletBalance: newBalance })
    }
    return true
  },
}), {
  name: 'futuring-store-v3',
  version: 9,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: (persistedState: any, version: number): any => {
    const state = persistedState as Record<string, unknown>
    const result = {...state}
    if (version<2) { result.lastDailyRewardAt=null; result.customization={ownedItemIds:[],ownedItemExpiry:{},equippedFrame:null,equippedBadge:null,equippedTheme:null} }
    if (version<3) { const debates=(state.debates as Debate[]|undefined)??[]; result.debates=debates.map(d => ({...d, type:d.type??'binary'})) }
    if (version<4) { result.registeredUsers={} }
    if (version<5) { result.whaleBattles=[] }
    if (version<7) { result.debates=[] }
    if (version<8) { result.lpPositions=[]; result.auctions=[]; result.bounties=[]; result.economySettings=DEFAULT_ECONOMY; result.whaleBattles=[] }
    if (version<9) { result.bookmarks=[] }
    return result
  },
}))

// LP 풀 정의 (store 외부에서도 사용)
export const LP_POOLS = [
  { id:'macro',  icon:'🌐', market:'거시경제 마켓', desc:'금리·환율·GDP 등 거시경제 예측 마켓', apy:12.4 },
  { id:'crypto', icon:'₿',  market:'크립토 마켓',   desc:'비트코인·이더리움 등 암호화폐 예측 마켓', apy:18.7 },
  { id:'index',  icon:'📊', market:'전체 인덱스',   desc:'전체 카테고리를 아우르는 인덱스 풀', apy:9.2 },
]

export const selectLiveDebates = (s: PledgeStore) => s.debates.filter(d => d.status==='live')
export const selectMarginalImpact = (id: string, side: Side, amount: number) => (s: PledgeStore) => {
  const d = s.debates.find(x => x.id===id)
  if (!d||d.type==='multi') return 0
  return calcMarginalImpact(d.sideA_pool, d.sideB_pool, side as 'A' | 'B', amount)
}
