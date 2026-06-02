'use client'
import { C } from '@/lib/constants'

function Skeleton({ w = '100%', h = 16, radius = 8, mb = 0 }: { w?: string | number; h?: number; radius?: number; mb?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: mb }} />
  )
}

export function SkeletonMarketCard() {
  return (
    <div style={{ background: C.white, borderRadius: 20, padding: 20, border: `1.5px solid ${C.grayBorder}` }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Skeleton w={60} h={22} radius={6} />
        <Skeleton w={40} h={22} radius={6} />
      </div>
      <Skeleton h={18} mb={6} />
      <Skeleton w="80%" h={18} mb={16} />
      <Skeleton h={7} radius={99} mb={8} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <Skeleton w={80} h={14} />
        <Skeleton w={60} h={14} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Skeleton h={38} radius={12} />
        <Skeleton h={38} radius={12} />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {Array.from({ length: count }).map((_, i) => <SkeletonMarketCard key={i} />)}
    </>
  )
}
