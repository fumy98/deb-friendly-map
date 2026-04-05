'use client'

import { useState } from 'react'
import { CATEGORIES } from '@/lib/categories'

type Props = {
  lat: number
  lng: number
  onSubmit: () => void
  onCancel: () => void
}

const SEVERITY_OPTIONS = [
  { value: 1, label: '少し不便', stars: '⭐' },
  { value: 2, label: 'かなり不便', stars: '⭐⭐' },
  { value: 3, label: '通れない・入れない', stars: '⭐⭐⭐' },
]

export default function ReportForm({ lat, lng, onSubmit, onCancel }: Props) {
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [severity, setSeverity] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleCat = (slug: string) => {
    setSelectedCats(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  const handleSubmit = async () => {
    if (selectedCats.length === 0) { setError('カテゴリを1つ以上選択してください'); return }
    if (!severity) { setError('不便の度合いを選択してください'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          severity,
          description: description || null,
          categorySlugs: selectedCats,
        }),
      })
      if (!res.ok) throw new Error('投稿に失敗しました')
      onSubmit()
    } catch {
      setError('投稿に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-white rounded-t-2xl shadow-2xl p-5 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">📍 この場所を報告</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>

      {/* カテゴリ */}
      <p className="text-sm font-semibold text-gray-700 mb-2">どんな不便がありますか？（複数可）</p>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {CATEGORIES.map(cat => (
          <button
            key={cat.slug}
            onClick={() => toggleCat(cat.slug)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all ${
              selectedCats.includes(cat.slug)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <span className="text-2xl">{cat.icon}</span>
            <span className="text-[10px] font-semibold text-gray-700 leading-tight">{cat.labelJa}</span>
          </button>
        ))}
      </div>

      {/* 難易度 */}
      <p className="text-sm font-semibold text-gray-700 mb-2">不便の度合いは？</p>
      <div className="flex gap-2 mb-5">
        {SEVERITY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSeverity(opt.value)}
            className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
              severity === opt.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <span className="text-sm">{opt.stars}</span>
            <span className="text-[10px] font-semibold text-gray-700 leading-tight text-center">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* コメント */}
      <p className="text-sm font-semibold text-gray-700 mb-2">コメント（任意）</p>
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="詳しい状況を教えてください"
        className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:border-blue-400 mb-4"
      />

      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-all"
      >
        {loading ? '投稿中...' : '🗺️ 地図に投稿する'}
      </button>
    </div>
  )
}
