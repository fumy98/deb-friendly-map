export const CATEGORIES = [
  { slug: 'narrow_road',     labelJa: '道幅が狭い',         icon: '🚶' },
  { slug: 'narrow_toilet',   labelJa: 'トイレが狭い',       icon: '🚽' },
  { slug: 'narrow_entrance', labelJa: '入口が狭い',         icon: '🚪' },
  { slug: 'narrow_seat',     labelJa: '席が狭い',           icon: '🪑' },
  { slug: 'step',            labelJa: '段差あり',           icon: '⛔' },
  { slug: 'no_elevator',     labelJa: 'エレベーターなし',   icon: '🛗' },
  { slug: 'no_luggage_space',labelJa: '荷物置き場なし',     icon: '🧺' },
  { slug: 'no_nursing_room', labelJa: '授乳室・おむつ台なし', icon: '👶' },
] as const

export type CategorySlug = typeof CATEGORIES[number]['slug']
