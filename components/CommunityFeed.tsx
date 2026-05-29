'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type CommunityEntry, getSeedEntries, makeTopicEntry } from '@/lib/communityEntries'
import { usePledgeStore } from '@/store/usePledgeStore'

const BLUE = '#2563EB'
const RED  = '#DC2626'

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 5)  return '방금'
  if (s < 60) return `${s}초 전`
  if (s < 3600) return `${Math.floor(s / 60)}분 전`
  return `${Math.floor(s / 3600)}시간 전`
}

function getTrustBadge(user: string): { emoji: string; label: string } | null {
  const hash = user.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  if (hash % 7 === 0) return { emoji: '🏆', label: '마스터' }
  if (hash % 5 === 0) return { emoji: '✅', label: '검증됨' }
  return null
}

function FeedRow({ entry, isNew, likes, likedByMe, onLike }: {
  entry: CommunityEntry; isNew: boolean
  likes: number; likedByMe: boolean; onLike: (id: string) => void
}) {
  const router = useRouter()
  const isYes = entry.side === 'A'
  const trust = getTrustBadge(entry.user)
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '12px 16px',
      borderBottom: '1px solid #F9FAFB',
      backgroundColor: isNew ? '#FAFBFF' : 'transparent',
      transition: 'background-color 2s ease',
      animation: isNew ? 'cf-slide 0.28s ease' : 'none',
    }}>
      <div onClick={()=>router.push(`/user/${entry.user}`)} style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: entry.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2, cursor:'pointer' }}>
        {entry.user[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <span onClick={()=>router.push(`/user/${entry.user}`)} style={{ fontSize: 12, fontWeight: 700, color: '#111827', cursor:'pointer', textDecoration:'underline', textUnderlineOffset:2 }}>{entry.user}</span>
          {trust && <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: 4 }}>{trust.emoji} {trust.label}</span>}
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timeAgo(entry.ts)}</span>
        </div>
        {entry.type === 'bet' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', backgroundColor: isYes ? '#EFF6FF' : '#FEF2F2', color: isYes ? BLUE : RED, borderRadius: 5 }}>{isYes ? 'YES' : 'NO'}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{entry.text}</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>베팅</span>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{entry.text}</p>
        )}
        <button onClick={() => onLike(entry.id)} style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: likedByMe ? BLUE : '#D1D5DB', padding: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill={likedByMe ? BLUE : 'none'} stroke={likedByMe ? BLUE : '#D1D5DB'} strokeWidth="2">
            <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
          </svg>
          {likes > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: likedByMe ? BLUE : '#9CA3AF' }}>{likes}</span>}
          {likes === 0 && <span style={{ fontSize: 11, color: '#D1D5DB' }}>유용해요</span>}
        </button>
      </div>
    </div>
  )
}

interface CommunityFeedProps {
  topic?: string | null
  title?: string | null
  onClose?: () => void
  compact?: boolean  // 고래 페이지용 compact 모드
}

export default function CommunityFeed({ topic, title, onClose, compact = false }: CommunityFeedProps) {
  const username = usePledgeStore(s => s.currentUser.username)
  const [entries, setEntries] = useState<CommunityEntry[]>([])
  const [newestId, setNewestId] = useState<string | null>(null)
  const [inputVal, setInputVal] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [likes, setLikes] = useState<Record<string, number>>({})
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set())
  const [sortMode, setSortMode] = useState<'latest' | 'best'>('latest')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!topic) { setEntries([]); setNewestId(null); setLikes({}); setLikedSet(new Set()); return }
    setEntries(getSeedEntries(topic, topic, 12))
    setNewestId(null)
  }, [topic])

  useEffect(() => {
    if (!topic) return
    let tid: ReturnType<typeof setTimeout>
    const schedule = () => {
      tid = setTimeout(() => {
        const e = makeTopicEntry(topic)
        setNewestId(e.id)
        setEntries(prev => [e, ...prev].slice(0, 30))
        schedule()
      }, 2500 + Math.random() * 3000)
    }
    schedule()
    return () => clearTimeout(tid)
  }, [topic])

  const handleLike = (id: string) => {
    if (likedSet.has(id)) return
    setLikes(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
    setLikedSet(prev => new Set([...prev, id]))
  }

  const handleSubmit = () => {
    const text = inputVal.trim()
    if (!text || !topic) return
    const colors = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#DC2626']
    const newEntry: CommunityEntry = {
      id: `user-${Date.now()}`, ts: Date.now(),
      user: username || '익명',
      avatarColor: colors[(username || '익명').charCodeAt(0) % colors.length],
      type: 'comment', text,
    }
    setNewestId(newEntry.id)
    setEntries(prev => [newEntry, ...prev].slice(0, 30))
    setInputVal('')
  }

  const sortedEntries = sortMode === 'best'
    ? [...entries].sort((a, b) => (likes[b.id] ?? 0) - (likes[a.id] ?? 0))
    : entries

  const maxH = compact ? '300px' : 'calc(100vh - 280px)'

  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', width: compact ? '100%' : undefined, height: compact ? undefined : '100%', display: 'flex', flexDirection: 'column' as const }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>커뮤니티</span>
          {topic && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', animation: 'cf-pulse 2s infinite' }} />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>실시간</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {topic && (
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 2 }}>
              {(['latest', 'best'] as const).map(mode => (
                <button key={mode} onClick={() => setSortMode(mode)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: sortMode === mode ? BLUE : 'transparent', color: sortMode === mode ? '#fff' : '#9CA3AF' }}>
                  {mode === 'latest' ? '최신' : '🔥 베스트'}
                </button>
              ))}
            </div>
          )}
          {onClose && (
            <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', cursor: 'pointer', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#9CA3AF' }}>✕</button>
          )}
        </div>
      </div>

      {/* 타이틀 */}
      {topic && title && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #F3F4F6', backgroundColor: '#F9FAFB' }}>
          <p style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        </div>
      )}

      {/* 빈 상태 */}
      {!topic && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>마켓을 선택하세요</p>
          <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>마켓 카드에서 커뮤니티를 눌러보세요</p>
        </div>
      )}

      {/* 피드 */}
      {topic && (
        <div style={{ overflowY: 'auto', maxHeight: maxH, flex: 1 }}>
          {sortedEntries.map(e => (
            <FeedRow key={e.id} entry={e} isNew={e.id === newestId} likes={likes[e.id] ?? 0} likedByMe={likedSet.has(e.id)} onLike={handleLike} />
          ))}
        </div>
      )}

      {/* 입력창 */}
      {topic && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            ref={inputRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="의견을 남겨보세요..."
            style={{ flex: 1, fontSize: 13, fontWeight: 500, outline: 'none', backgroundColor: inputFocused ? '#fff' : '#F9FAFB', border: `1.5px solid ${inputFocused ? BLUE : '#F3F4F6'}`, borderRadius: 10, color: '#111827', padding: '8px 12px', transition: 'all 0.15s' }}
          />
          <button onClick={handleSubmit} disabled={!inputVal.trim()} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: BLUE, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: inputVal.trim() ? 1 : 0.3, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}

      <style>{`
        @keyframes cf-slide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cf-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  )
}
