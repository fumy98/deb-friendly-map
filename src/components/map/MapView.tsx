'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import ReportForm from './ReportForm'

type Report = {
  id: string
  latitude: number
  longitude: number
  severity: number
  title: string | null
  description: string | null
  categories: { slug: string; labelJa: string; icon: string }[]
}

type ClickedPin = {
  id: string
  severity: number
  description: string
  label: string
  title: string
  icon: string
  x: number
  y: number
}

const SEVERITY_COLOR: Record<number, string> = {
  1: '#16a34a',
  2: '#d97706',
  3: '#dc2626',
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [formPos, setFormPos] = useState<{ lat: number; lng: number } | null>(null)
  const [clickedPin, setClickedPin] = useState<ClickedPin | null>(null)
  const [reports, setReports] = useState<Report[]>([])

  const fetchReports = useCallback(async () => {
    if (!map.current) return
    const bounds = map.current.getBounds()
    const params = new URLSearchParams({
      south: bounds.getSouth().toString(),
      north: bounds.getNorth().toString(),
      west:  bounds.getWest().toString(),
      east:  bounds.getEast().toString(),
    })
    const res = await fetch(`/api/reports?${params}`)
    const data: Report[] = await res.json()
    setReports(data)
    updatePins(data)
  }, [])

  const updatePins = (data: Report[]) => {
    if (!map.current) return
    const source = map.current.getSource('reports') as maplibregl.GeoJSONSource
    if (!source) return
    source.setData({
      type: 'FeatureCollection',
      features: data.map(r => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
        properties: {
          id: r.id,
          severity: r.severity,
          color: SEVERITY_COLOR[r.severity] ?? '#2563eb',
          icon: r.categories[0]?.icon ?? '📍',
          label: r.categories.map(c => c.labelJa).join('・'),
          title: r.title ?? '',
          description: r.description ?? '',
        },
      })),
    })
  }

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
      center: [139.6917, 35.6895],
      zoom: 13,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right'
    )

    map.current.on('load', () => {
      if (!map.current) return

      // GeoJSONソース追加
      map.current.addSource('reports', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      })

      // クラスター円
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'reports',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#2563eb',
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 28, 30, 36],
          'circle-opacity': 0.85,
        },
      })

      // クラスター数ラベル
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'reports',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 13,
          'text-font': ['Open Sans Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      })

      // 個別ピン
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'reports',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      fetchReports()
    })

    // 地図移動後にピン再取得
    map.current.on('moveend', fetchReports)

    // クラスタークリックでズーム
    map.current.on('click', 'clusters', e => {
      if (!map.current) return
      const features = map.current.queryRenderedFeatures(e.point, { layers: ['clusters'] })
      const clusterId = features[0]?.properties?.cluster_id
      if (!clusterId) return
      const source = map.current.getSource('reports') as maplibregl.GeoJSONSource
      source.getClusterExpansionZoom(clusterId).then(zoom => {
        if (!map.current) return
        const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number]
        map.current.easeTo({ center: coords, zoom: zoom ?? 14 })
      }).catch(() => {})
    })

    // ピンクリックで詳細表示
    map.current.on('click', 'unclustered-point', e => {
      if (!e.features?.[0]) return
      const props = e.features[0].properties
      setClickedPin({
        id: props.id,
        severity: props.severity,
        description: props.description ?? '',
        label: props.label ?? '',
        title: props.title ?? '',
        icon: props.icon ?? '📍',
        x: e.point.x,
        y: e.point.y,
      })
      setFormPos(null)
    })

    // 地図の空白部分クリックで投稿フォーム
    map.current.on('click', e => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['unclustered-point', 'clusters'],
      })
      if (features.length > 0) return
      setClickedPin(null)
      setFormPos({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    })

    // カーソル変更
    map.current.on('mouseenter', 'clusters', () => { map.current!.getCanvas().style.cursor = 'pointer' })
    map.current.on('mouseleave', 'clusters', () => { map.current!.getCanvas().style.cursor = '' })
    map.current.on('mouseenter', 'unclustered-point', () => { map.current!.getCanvas().style.cursor = 'pointer' })
    map.current.on('mouseleave', 'unclustered-point', () => { map.current!.getCanvas().style.cursor = '' })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [fetchReports])

  // reportsが更新されたらピン再描画
  useEffect(() => {
    updatePins(reports)
  }, [reports])

  const handleFormSubmit = () => {
    setFormPos(null)
    fetchReports()
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* 投稿フォーム */}
      {formPos && (
        <ReportForm
          lat={formPos.lat}
          lng={formPos.lng}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormPos(null)}
        />
      )}

      {/* ピン詳細ポップアップ */}
      {clickedPin && (
        <div
          className="absolute z-20 bg-white rounded-2xl shadow-2xl p-4 w-64"
          style={{ left: Math.min(clickedPin.x, window.innerWidth - 280), top: Math.max(clickedPin.y - 160, 10) }}
        >
          <button
            onClick={() => setClickedPin(null)}
            className="absolute top-2 right-3 text-gray-400 hover:text-gray-600"
          >✕</button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{clickedPin.icon}</span>
            <div>
              {clickedPin.title && (
                <div className="text-sm font-bold text-gray-900 mb-0.5">{clickedPin.title}</div>
              )}
              <div className="text-xs text-gray-500">{clickedPin.label || '不明'}</div>
              <div className="text-xs text-gray-400">
                {'⭐'.repeat(clickedPin.severity)}
                {['', ' 少し不便', ' かなり不便', ' 通れない・入れない'][clickedPin.severity]}
              </div>
            </div>
          </div>
          {clickedPin.description && (
            <p className="text-xs text-gray-600 mt-1 border-t border-gray-100 pt-2">{clickedPin.description}</p>
          )}
        </div>
      )}

      {/* 投稿ヒント */}
      {!formPos && !clickedPin && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-4 py-2 rounded-full pointer-events-none">
          地図をタップして不便な場所を報告
        </div>
      )}
    </div>
  )
}
