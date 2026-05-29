export interface MarketMetrics {
  poolRatio: number
  logitOdds: number
  impliedProbA: number
  impliedProbB: number
  payoutMultiplierA: number
  payoutMultiplierB: number
  totalPool: number
  logitLabel: string
}

const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v))

export function calcMarketMetrics(sideA_pool: number, sideB_pool: number): MarketMetrics {
  const SMOOTHING = 1
  const smoothA = Math.max(sideA_pool, 0) + SMOOTHING
  const smoothB = Math.max(sideB_pool, 0) + SMOOTHING
  const totalPool = smoothA + smoothB
  const rawProbA = clamp(smoothA / totalPool, 1e-6, 1 - 1e-6)
  const rawProbB = 1 - rawProbA
  const logitOdds = Math.log(rawProbA / rawProbB)
  const poolRatio = sideB_pool === 0 ? (sideA_pool === 0 ? 1 : Infinity) : sideA_pool / sideB_pool
  const payoutMultiplierA = totalPool / smoothA
  const payoutMultiplierB = totalPool / smoothB
  const sign = logitOdds >= 0 ? '+' : ''
  const logitLabel = `${sign}${logitOdds.toFixed(3)}`
  return {
    poolRatio, logitOdds,
    impliedProbA: rawProbA, impliedProbB: rawProbB,
    payoutMultiplierA, payoutMultiplierB,
    totalPool: (sideA_pool ?? 0) + (sideB_pool ?? 0),
    logitLabel,
  }
}

export const formatProb = (p: number) => `${(clamp(p, 0, 1) * 100).toFixed(1)}%`
export const formatMultiplier = (m: number) => `${Math.max(m, 1).toFixed(2)}x`

export function calcMarginalImpact(sideA_pool: number, sideB_pool: number, side: 'A' | 'B', amount: number): number {
  const before = calcMarketMetrics(sideA_pool, sideB_pool)
  const after = calcMarketMetrics(
    side === 'A' ? sideA_pool + amount : sideA_pool,
    side === 'B' ? sideB_pool + amount : sideB_pool
  )
  return after.impliedProbA - before.impliedProbA
}
