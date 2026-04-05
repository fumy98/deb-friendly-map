import MapWrapper from '@/components/map/MapWrapper'

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-200 z-10 shadow-sm">
        <span className="text-2xl">🗺️</span>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">デブフレンドリーマップ</h1>
          <p className="text-xs text-gray-500">"あったら嬉しい"より"なくて困る"を無くしたい</p>
        </div>
      </header>

      {/* Map */}
      <main className="flex-1 relative">
        <MapWrapper />
      </main>
    </div>
  )
}
