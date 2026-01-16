'use client'

import React, { useEffect, useState, useMemo, forwardRef, useImperativeHandle, useRef } from 'react'

export interface ExcalidrawClientProps {
  initialData: any
  onChange?: (elements: any[], appState: any) => void
}

export type ExcalidrawClientHandle = {
  getData: () => any
}

const ExcalidrawClient = forwardRef<ExcalidrawClientHandle, ExcalidrawClientProps>(
  ({ initialData, onChange }, ref) => {
    const [ExcalidrawComp, setExcalidrawComp] = useState<any>(null)
    const latestDataRef = useRef<any>(initialData || { elements: [], appState: {} })
    const mountedRef = useRef(true)

    useEffect(() => {
      mountedRef.current = true
      import('@excalidraw/excalidraw')
        .then((mod) => {
          console.log('Excalidraw module imported:', !!mod?.Excalidraw)
          if (mountedRef.current) setExcalidrawComp(() => mod.Excalidraw)
        })
        .catch((err) => {
          console.error('Erro ao carregar Excalidraw dinamicamente:', err)
        })

      return () => {
        mountedRef.current = false
      }
    }, [])

    // capture initialData only on first mount
    const memoData = useMemo(() => initialData || { elements: [], appState: {} }, [])

    useImperativeHandle(ref, () => ({
      getData: () => latestDataRef.current
    }), [])

    if (!ExcalidrawComp) return null

    const Excalidraw = ExcalidrawComp
    const effectiveData: any = (() => {
      if (!memoData) return { elements: [], appState: {} }
      if (typeof memoData === 'string') {
        try { return JSON.parse(memoData) } catch { return { elements: [], appState: {} } }
      }
      if (memoData.elements) return memoData
      if (memoData.data && memoData.data.elements) return memoData.data
      if (Array.isArray(memoData)) return { elements: memoData, appState: {} }
      return memoData
    })()

    console.log('Rendering Excalidraw, effectiveData keys:', Object.keys(effectiveData || {}), 'elements length:', (effectiveData.elements || []).length)

    try {
      return (
        <div className="w-full h-full bg-white">
          <Excalidraw
            initialData={effectiveData}
            onChange={(elements: any[], appState: any) => {
              latestDataRef.current = { elements, appState }
              if (onChange) onChange(elements, appState)
            }}
            theme="light"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )
    } catch (err) {
      console.error('Erro ao renderizar Excalidraw:', err)
      return (
        <div className="w-full h-full flex items-center justify-center bg-white text-gray-600">
          Erro ao carregar editor
        </div>
      )
    }
  }
)

export default ExcalidrawClient
