'use client'
import { useState, useEffect } from 'react'
import { useDevice } from '@/lib/useDevice'
import { supabase } from '@/lib/supabase'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import { C } from '@/lib/constants'
import Link from 'next/link'

type RankType = 'balance' | 'winrate' | 'volume'

interface RankUser {
  rank: number
  username: string
  value: number
  badge?: string
}

const RANK_CONFIG = {
  balance:  { label: '💎 자산 랭킹',  unit: 'P',  desc: '보유 포인트 기준' },
  winrate:  { label: '🎯 승률 랭킹',  unit: '%',  desc: '최소 5번 이상 베팅' },
  volume:   { label: '🔥 거래량 랭킹', unit: 'P',  desc: '총 베팅 금액 기준' },
}

const MEDAL = ['🥇', '🥈', '🥉']

function fmt(n: number, unit: string) {
  if (unit === '%') return `${n}%`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M P`
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만 P`
  return `${n.toLocaleString()} P`
}

export default function RankingPage() {
  const device = useDevice(); const isMobile = device === 'mobile'
  const Nav = isMobile ? FuturingNav : PCNav
  const [rankType, setRankType] = useState<RankType>('balance')
  const [users, setUsers] = useState<RankUser[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<RankUser | null>(null)

  useEffect(() => {
    setLoading(true)
    loadRanking(rankType)
  }, [rankType])

  const loadRanking = async (type: RankType) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (type === 'balance') {
      const { data } = await supabase.from('profiles').select('username, wallet_balance').order('wallet_balance', { ascending: false }).limit(100)
      if (!data) { setLoading(false); return }
      const ranked = data.map((u: { username: string; wallet_balance: number }, i: number) => ({
        rank: i + 1, username: u.username, value: u.wallet_balance,
      }))
      setUsers(ranked.slice(0, 50))
      if (user) {
        const mine = ranked.find(r => r.username === data.find((_: unknown, i: number) => data[i] && user?.id)?.username)
        if (mine) setMyRank(mine)
      }
    } else if (type === 'volume') {
      const { data } = await supabase.from('bets').select('username, amount').eq('action', 'PLEDGE')
      if (!data) { setLoading(false); return }
      const map: Record<string, number> = {}
      data.forEach((b: { username: string; amount: number }) => { map[b.username] = (map[b.username] ?? 0) + b.amount })
      const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 50)
      setUsers(sorted.map(([username, value], i) => ({ rank: i + 1, username, value })))
    } else if (type === 'winrate') {
      const { data } = await supabase.from('bets').select('username, action, market_id')
      if (!data) { setLoading(false); return }
      const pledgeMap: Record<string, Set<string>> = {}
      const payoutMap: Record<string, Set<string>> = {}
      data.forEach((b: { username: string; action: string; market_id: string }) => {
        if (b.action === 'PLEDGE') { if (!pledgeMap[b.username]) pledgeMap[b.username] = new Set(); pledgeMap[b.username].add(b.market_id) }
        if (b.action === 'PAYOUT') { if (!payoutMap[b.username]) payoutMap[b.username] = new Set(); payoutMap[b.username].add(b.market_id) }
      })
      const ranked = Object.entries(pledgeMap)
        .filter(([, markets]) => markets.size >= 5)
        .map(([username, markets]) => ({
          username, value: Math.round(((payoutMap[username]?.size ?? 0) / markets.size) * 100)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 50)
        .map((u, i) => ({ ...u, rank: i + 1 }))
      setUsers(ranked)
    }
    setLoading(false)
  }

  const config = RANK_CONFIG[rankType]

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '40px 24px 60px' }}>

        {/* 헤더 */}
        <div style={{ background: `linear-gradient(135deg,${C.navy},#1E3A8A)`, borderRadius: 20, padding: '24px 28px', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>🏆 랭킹</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>futuring 유저 순위표</p>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(Object.keys(RANK_CONFIG) as RankType[]).map(k => (
            <button key={k} onClick={() => setRankType(k)}
              style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: rankType === k ? C.navy : C.white, color: rankType === k ? '#fff' : C.gray, boxShadow: rankType === k ? '0 2px 8px rgba(0,0,0,0.15)' : `0 0 0 1.5px ${C.grayBorder}` }}>
              {RANK_CONFIG[k].label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12, color: C.gray, marginBottom: 16 }}>{config.desc}</p>

        {/* 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.gray }}>불러오는 중...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: C.white, borderRadius: 20, border: `1px solid ${C.grayBorder}` }}>
            <p style={{ color: C.gray }}>데이터가 없어요</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map(u => (
              <Link key={u.username} href={`/user/${u.username}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: C.white, borderRadius: 16, padding: '14px 18px', border: u.rank <= 3 ? `2px solid ${u.rank === 1 ? '#F59E0B' : u.rank === 2 ? '#94A3B8' : '#CD7C2F'}` : `1px solid ${C.grayBorder}`, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  {/* 순위 */}
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: u.rank <= 3 ? (u.rank === 1 ? '#FEF3C7' : u.rank === 2 ? '#F1F5F9' : '#FDF2E9') : C.grayLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: u.rank <= 3 ? 20 : 14, fontWeight: 800, color: u.rank > 3 ? C.gray : undefined, flexShrink: 0 }}>
                    {u.rank <= 3 ? MEDAL[u.rank - 1] : u.rank}
                  </div>
                  {/* 아바타 */}
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${C.blueMid},${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                    {u.username[0].toUpperCase()}
                  </div>
                  {/* 이름 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{u.username}</p>
                  </div>
                  {/* 값 */}
                  <p style={{ fontSize: 16, fontWeight: 900, color: u.rank <= 3 ? (u.rank === 1 ? '#D97706' : C.navy) : C.navy, flexShrink: 0 }}>
                    {fmt(u.value, config.unit)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      {isMobile && <BottomNav />}
    </div>
  )
}
