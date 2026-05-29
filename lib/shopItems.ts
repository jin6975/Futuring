export type ShopCategory = 'frame' | 'badge' | 'theme'
export interface ShopItem {
  id: string; name: string; description: string
  category: ShopCategory; price: number; durationDays?: number
  preview: { bg: string; emoji?: string; text?: string }
}
export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  frame: '프레임', badge: '칭호', theme: '테마'
}
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'frame-gold', name: '골드 프레임', description: '황금빛 프로필 링', category: 'frame', price: 5000, preview: { bg: '#F59E0B' } },
  { id: 'frame-blue', name: '블루 프레임', description: '시원한 블루 프로필 링', category: 'frame', price: 3000, preview: { bg: '#3B82F6' } },
  { id: 'frame-purple', name: '퍼플 프레임', description: '신비로운 퍼플 프로필 링', category: 'frame', price: 4000, preview: { bg: '#7C3AED' } },
  { id: 'frame-limited', name: '레전드 프레임', description: '7일 한정 레전드 링', category: 'frame', price: 2000, durationDays: 7, preview: { bg: '#EF4444' } },
  { id: 'badge-whale', name: '🐋 웨일 배지', description: '대규모 베터 인증', category: 'badge', price: 8000, preview: { bg: '#EFF6FF', emoji: '🐋', text: 'Whale' } },
  { id: 'badge-oracle', name: '🔮 오라클 배지', description: '예측 고수 인증', category: 'badge', price: 6000, preview: { bg: '#F5F3FF', emoji: '🔮', text: 'Oracle' } },
  { id: 'badge-degen', name: '🎲 데겐 배지', description: '극단적 배터 인증', category: 'badge', price: 4000, preview: { bg: '#FEF3C7', emoji: '🎲', text: 'Degen' } },
  { id: 'badge-limited', name: '⚡ 번개 배지', description: '7일 한정 배지', category: 'badge', price: 1500, durationDays: 7, preview: { bg: '#FFFBEB', emoji: '⚡', text: 'Flash' } },
  { id: 'theme-dark', name: '다크 테마', description: '눈이 편한 다크 카드', category: 'theme', price: 5000, preview: { bg: '#0F172A' } },
  { id: 'theme-ocean', name: '오션 테마', description: '바다빛 카드 배경', category: 'theme', price: 4000, preview: { bg: '#0C4A6E' } },
  { id: 'theme-forest', name: '포레스트 테마', description: '숲속 카드 배경', category: 'theme', price: 4000, preview: { bg: '#14532D' } },
  { id: 'theme-sunset', name: '선셋 테마', description: '노을빛 카드 배경', category: 'theme', price: 3000, preview: { bg: '#7C2D12' } },
]
