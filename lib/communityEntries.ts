export interface CommunityEntry {
  id: string; type: 'comment' | 'bet'
  user: string; avatarColor: string
  side?: 'A' | 'B'; text: string; ts: number
}

export const USERS = [
  { name: 'whale_89',   color: '#7C3AED' },
  { name: 'alpha_kim',  color: '#0891B2' },
  { name: 'quant_x',   color: '#059669' },
  { name: 'moon_bet',  color: '#D97706' },
  { name: 'bear_trap', color: '#DC2626' },
  { name: 'fed_watch', color: '#2563EB' },
  { name: 'btc_maxi',  color: '#F59E0B' },
  { name: 'eth_bull',  color: '#8B5CF6' },
  { name: 'macro_pro', color: '#10B981' },
  { name: 'vol_desk',  color: '#EF4444' },
  { name: 'degen_99',  color: '#EC4899' },
  { name: 'sig_trade', color: '#14B8A6' },
]

const MARKET_COMMENTS: { keyword: string; comments: string[] }[] = [
  { keyword: '연준', comments: ['연준 피벗은 불가피해. 채권시장이 이미 반영했어.', '인플레이션 아직 끈적해. 연말까지 동결이야.', 'YES 62%는 너무 낮은 거 아냐?', '여기 롱 포지션 너무 몰려있어. 위험해.', 'PCE 추세가 전부야. Q3에 인하 온다.', '노동시장 너무 타이트해. 2027년 전에 인하 없어.', '점도표는 한 번, 시장은 세 번 기대. 괴리 좁혀진다.'] },
  { keyword: '도미넌스', comments: ['BTC 도미넌스 이미 58이야. 60 사실상 확정.', '알트 시즌 오면 도미넌스 무조건 꺾여. 매 사이클마다 그랬어.', 'ETF 자금 유입이 BTC 강세 이어준다.', '리테일 알트 로테이션이 도미넌스 죽인다.', '기관 배분 90%가 BTC야. YES 쉬운 거 아냐?', '스테이블코인 시총 급증이 도미넌스 수치 희석시켜. 조심해.'] },
  { keyword: '비트코인', comments: ['반감기 + ETF 유입 = 2억원이 바닥이야.', '매크로 역풍이 커. 2억 전에 2027은 희망회로야.', '마이크로스트래티지가 모든 하락 사고있어. 그냥 YES야.', '옵션 시장이 낮은 목표치 시사해. NO에 앉아있어.', '반감기 후 18개월이 사이클 고점. 수학적으로 맞아.', '온체인 데이터 2020년 이후 최대 축적 보여주고 있어.'] },
  { keyword: '엔비디아', comments: ['엔비디아 AI 인프라에서 실질적 경쟁자 없어.', 'AMD MI350이 시장 예상보다 빠르게 따라오고 있어.', 'H200 수요 적체 12개월 이상. 구조적으로 못 따라잡아.', '하이퍼스케일러들 자체 칩 만들고 있어. 리스크 진짜야.', '데이터센터 매출 계속 가속화. YES 쉽네.', '추론 컴퓨팅 전환이 다른 아키텍처 유리하게 만들 수 있어.'] },
  { keyword: '애플', comments: ['애플 AR 글래스, 3년째 "내년에 나와" 반복 중.', '아시아 공급망 체크아웃 2026이 진짜래.', 'Vision Pro 잠식 우려로 2027 미룰 가능성 높아.', '유출된 SKU 코드가 2026년 Q2 출시 확인해줘. YES야.', '팀 쿡은 너무 보수적이야. 이번 사이클 AR 못 내놔.'] },
  { keyword: '코스피', comments: ['외국인 매수세 다시 들어오고 있어. 3500 가능해.', '원달러 환율이 문제야. 수출주 발목 잡힌다.', '반도체 사이클 회복 + AI 테마 = 3500 간다.', '미국 경기침체 오면 코스피도 못 버텨.', '연기금 매수 지속되고 있어. 하방 탄탄해.'] },
  { keyword: 'gpt', comments: ['GPT-5 이미 훈련 완료야. 안전성 평가 중인 거야.', '샘이 경쟁 전략으로 일부러 늦추는 거야.', '내부 벤치마크 유출본 진짜 미쳤어. 곧 나와.', 'EU 규제 압박이 일정 밀고 있어.', 'o3은 그냥 워밍업이었어. GPT-5 뜨겁게 온다.', '오픈AI 번 레이트 보면 Q3 전에 출시 강제돼.'] },
  { keyword: '이더리움', comments: ['이더 BTC 역전은 패러다임 전환 필요해.', '이더 스테이킹 수익률 내러티브 완전히 저평가됨.', '매 사이클마다 역전 위협하다가 실패해. 이번도 마찬가지.', 'EIP-4844가 수수료 구조를 완전히 바꿨어.', 'L2 파편화가 이더 가치 포착 장기적으로 해쳐.', '블랙록 ETH ETF 자금 유입 이제 시작이야. 지켜봐.'] },
  { keyword: 'kbo', comments: ['KIA 선발진 너무 좋아. 올해도 KIA야.', 'LG 타선 작년보다 강화됐어. 다크호스야.', '삼성 불펜 보강했어. 예상보다 강할 수 있어.', 'KT 토종 에이스 있는 한 무시 못 해.', '외국인 선수 운이 시즌 가른다.'] },
]

const FALLBACK_COMMENTS = [
  '흥미로운 셋업이네. 지켜보는 중.',
  '거래량이 움직임 확인해줘. YES 유지.',
  '스마트머니가 여기서 군중 역방향 가고 있어. NO야.',
  '역사적 선례가 NO쪽 강하게 지지해.',
  '리스크/리워드가 YES로 크게 기울어. 쉬운 선택이야.',
  '이 가격대에서 포지션 잡기 좋아.',
  '60% 확률은 과소평가된 것 같은데.',
  '이거 양쪽 다 논리 있어. 신중하게 봐야해.',
]

const AMOUNTS = [200, 300, 500, 800, 1000, 1500, 2000, 3000, 5000]

function strHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return Math.abs(h)
}

export function getCommentsForTopic(topic: string): string[] {
  const lower = topic.toLowerCase()
  for (const { keyword, comments } of MARKET_COMMENTS) {
    if (lower.includes(keyword)) return comments
  }
  return FALLBACK_COMMENTS
}

export function getSeedEntries(debateId: string, topic: string, count: number): CommunityEntry[] {
  const h = strHash(debateId)
  const comments = getCommentsForTopic(topic)
  return Array.from({ length: count }, (_, i) => {
    const user = USERS[(h + i * 3) % USERS.length]
    const isBet = (h + i * 7) % 5 === 0
    const baseTs = Date.now() - (count - i) * 120_000
    if (isBet) {
      const side: 'A' | 'B' = (h + i) % 2 === 0 ? 'A' : 'B'
      const amount = AMOUNTS[(h + i * 13) % AMOUNTS.length]
      return { id: `seed-${debateId}-${i}`, type: 'bet', user: user.name, avatarColor: user.color, side, text: `${amount.toLocaleString()} P`, ts: baseTs }
    }
    return { id: `seed-${debateId}-${i}`, type: 'comment', user: user.name, avatarColor: user.color, text: comments[(h + i * 11) % comments.length], ts: baseTs }
  })
}

export function makeTopicEntry(topic: string): CommunityEntry {
  const user = USERS[Math.floor(Math.random() * USERS.length)]
  const comments = getCommentsForTopic(topic)
  const isBet = Math.random() < 0.30
  if (isBet) {
    const side: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B'
    const amount = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)]
    return { id: Math.random().toString(36).slice(2), type: 'bet', user: user.name, avatarColor: user.color, side, text: `${amount.toLocaleString()} P`, ts: Date.now() }
  }
  return { id: Math.random().toString(36).slice(2), type: 'comment', user: user.name, avatarColor: user.color, text: comments[Math.floor(Math.random() * comments.length)], ts: Date.now() }
}
