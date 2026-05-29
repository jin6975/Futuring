'use client'
import { useMemo, useState } from 'react'
import { usePledgeStore, type Debate, type Side } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import FuturingMarketCard from '@/components/FuturingMarketCard'
import BetBottomSheet from '@/components/BetBottomSheet'
import { C } from '@/lib/constants'

const MOBILE_INITIAL = 3

export default function ExplorePage() {
  const debates = usePledgeStore(s => s.debates)
  const device = useDevice()
  const isMobile = device === 'mobile'
  const [search, setSearch] = useState('')
  const [betDebate, setBetDebate] = useState<Debate | null>(null)
  const [betSide, setBetSide] = useState<Side | null>(null)
  const [expandedCats, setExpandedCats] = useState<Record<string, number>>({})

  const categories = useMemo(() => {
    return Array.from(new Set<string>(debates.map(d => d.category))) as string[]
  }, [debates])

  const filtered = (cat: string): Debate[] =>
    debates.filter(d =>
      d.status === 'live' &&
      d.category === cat &&
      (search === '' || d.topic.toLowerCase().includes(search.toLowerCase()))
    )

  const getVisible = (cat: string, total: number) => {
    if (!isMobile) return total
    return expandedCats[cat] ?? MOBILE_INITIAL
  }

  const handleMore = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: (prev[cat] ?? MOBILE_INITIAL) + 3 }))
  }

  const Nav = isMobile ? FuturingNav : PCNav

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      <div style={isMobile ? { padding: '20px 16px 100px' } : { maxWidth: 1100, margin: '0 auto', padding: '40px 40px 60px' }}>
        {!isMobile && <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, marginBottom: 16 }}>탐색</h1>}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke={C.gray} strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke={C.gray} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="카테고리, 키워드 검색..."
            style={{ width: '100%', padding: '12px 16px 12px 38px', border: `1.5px solid ${C.grayBorder}`, borderRadius: 14, fontSize: 14, outline: 'none', color: C.navy, background: C.white, boxSizing: 'border-box' as const }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.gray }}>✕</button>}
        </div>

        {search && categories.every(cat => filtered(cat).length === 0) && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.gray }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 6 }}>검색 결과가 없어요</p>
            <p style={{ fontSize: 14 }}>'{search}'에 해당하는 마켓을 찾지 못했어요</p>
          </div>
        )}

        {categories.map(cat => {
          const items = filtered(cat)
          if (!items.length) return null
          const visibleCount = getVisible(cat, items.length)
          const visible = items.slice(0, visibleCount)
          const hasMore = isMobile && visibleCount < items.length
          return (
            <div key={cat} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>{cat}</span>
                <span style={{ fontSize: 12, color: C.gray }}>{items.length}개</span>
              </div>
              <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 10 } : { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {visible.map(d => (
                  <FuturingMarketCard key={d.id} debate={d} onBet={(debate, side) => { setBetDebate(debate); setBetSide(side) }} />
                ))}
              </div>
              {hasMore && (
                <button onClick={() => handleMore(cat)} style={{ width: '100%', marginTop: 12, padding: '12px 0', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, background: C.white, color: C.gray, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  더보기 ({items.length - visibleCount}개 남음) ↓
                </button>
              )}
            </div>
          )
        })}
      </div>
      {isMobile && <BottomNav />}
      <BetBottomSheet debate={betDebate} side={betSide} onClose={() => { setBetDebate(null); setBetSide(null) }} />
    </div>
  )
}
