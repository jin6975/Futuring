'use client'
import { useMemo, useState, Suspense } from 'react'
import { usePledgeStore, type Debate, type Side } from '@/store/usePledgeStore'
import { useDevice } from '@/lib/useDevice'
import { useSearchParams, useRouter } from 'next/navigation'
import FuturingNav from '@/components/FuturingNav'
import PCNav from '@/components/PCNav'
import BottomNav from '@/components/BottomNav'
import FuturingMarketCard from '@/components/FuturingMarketCard'
import BetBottomSheet from '@/components/BetBottomSheet'
import { C } from '@/lib/constants'

const SORTS = [
  { id: 'latest',   label: '최신순' },
  { id: 'deadline', label: '마감임박' },
  { id: 'volume',   label: '거래량' },
  { id: 'prob_high', label: 'YES 높은순' },
  { id: 'prob_low',  label: 'YES 낮은순' },
] as const
type SortKey = typeof SORTS[number]['id']

function ExploreInner() {
  const debates = usePledgeStore(s => s.debates)
  const isLoggedIn = usePledgeStore(s => s.currentUser.isLoggedIn)
  const device = useDevice(); const isMobile = device === 'mobile'
  const searchParams = useSearchParams()
  const router = useRouter()

  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [cat, setCat] = useState(searchParams.get('cat') ?? '전체')
  const [sort, setSort] = useState<SortKey>('latest')
  const [showResolved, setShowResolved] = useState(false)
  const [betDebate, setBetDebate] = useState<Debate | null>(null)
  const [betSide, setBetSide] = useState<Side | null>(null)

  const categories = useMemo(() => ['전체', ...Array.from(new Set<string>(debates.map(d => d.category))).sort()], [debates])

  const filtered = useMemo(() => {
    let list = debates.filter(d => showResolved ? true : (d.status === 'live' || d.status === 'pending_resolution'))
    if (cat !== '전체') list = list.filter(d => d.category === cat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(d =>
        d.topic.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.sideA_name?.toLowerCase().includes(q) ||
        d.sideB_name?.toLowerCase().includes(q) ||
        (d.owner ?? '').toLowerCase().includes(q)
      )
    }
    if (sort === 'latest')    list = [...list].sort((a, b) => b.createdAt - a.createdAt)
    if (sort === 'deadline')  list = [...list].sort((a, b) => a.resolvesAt - b.resolvesAt)
    if (sort === 'volume')    list = [...list].sort((a, b) => b.metrics.totalPool - a.metrics.totalPool)
    if (sort === 'prob_high') list = [...list].sort((a, b) => b.metrics.impliedProbA - a.metrics.impliedProbA)
    if (sort === 'prob_low')  list = [...list].sort((a, b) => a.metrics.impliedProbA - b.metrics.impliedProbA)
    return list
  }, [debates, cat, search, sort, showResolved])

  const Nav = isMobile ? FuturingNav : PCNav

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Nav />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 32px 60px' }}>

        {/* 검색 헤더 */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: C.navy, marginBottom: 14 }}>🔍 마켓 탐색</h1>
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="마켓 검색 — 주제, 카테고리, 작성자 검색 가능"
              style={{ width: '100%', padding: '14px 48px 14px 48px', borderRadius: 16, border: `2px solid ${search ? C.blue : C.grayBorder}`, fontSize: 15, background: C.white, boxSizing: 'border-box' as const, outline: 'none', transition: 'border-color 0.15s' }}
            />
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: C.grayLight, border: 'none', cursor: 'pointer', borderRadius: '50%', width: 24, height: 24, fontSize: 12, color: C.gray }}>✕</button>
            )}
          </div>
        </div>

        {/* 카테고리 */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: cat === c ? C.navy : C.white, color: cat === c ? '#fff' : C.gray, boxShadow: cat === c ? '0 2px 8px rgba(0,0,0,0.15)' : `0 0 0 1.5px ${C.grayBorder}` }}>
              {c}
            </button>
          ))}
        </div>

        {/* 정렬 + 필터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const }}>
          <div style={{ display: 'flex', gap: 6, flex: 1, overflowX: 'auto' }}>
            {SORTS.map(s => (
              <button key={s.id} onClick={() => setSort(s.id)}
                style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: sort === s.id ? C.blue : C.grayLight, color: sort === s.id ? '#fff' : C.gray }}>
                {s.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowResolved(r => !r)}
            style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 10, border: `1.5px solid ${showResolved ? C.blue : C.grayBorder}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: showResolved ? C.bluePale : C.white, color: showResolved ? C.blue : C.gray }}>
            {showResolved ? '✅ 종료 포함' : '종료 포함'}
          </button>
        </div>

        {/* 결과 */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 14, color: C.gray, fontWeight: 600 }}>
            {search ? `"${search}" 검색 결과 ` : ''}<strong style={{ color: C.navy }}>{filtered.length}개</strong>
          </p>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: C.white, borderRadius: 20, border: `1px solid ${C.grayBorder}` }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 6 }}>검색 결과가 없어요</p>
            <p style={{ fontSize: 14, color: C.gray }}>다른 키워드로 검색해보세요</p>
            <button onClick={() => { setSearch(''); setCat('전체') }}
              style={{ marginTop: 16, padding: '10px 24px', borderRadius: 12, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              전체 보기
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 16 }}>
            {filtered.map(d => (
              <FuturingMarketCard key={d.id} debate={d} onBet={(debate, side) => {
                if (!isLoggedIn) { router.push('/login'); return }
                setBetDebate(debate); setBetSide(side)
              }} />
            ))}
          </div>
        )}
      </div>

      {betDebate && betSide && (
        <BetBottomSheet debate={betDebate} side={betSide} onClose={() => { setBetDebate(null); setBetSide(null) }} />
      )}
      {isMobile && <BottomNav />}
    </div>
  )
}

export default function ExplorePage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>}><ExploreInner /></Suspense>
}
