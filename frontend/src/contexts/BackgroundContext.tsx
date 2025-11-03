'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type BackgroundType = 
  | 'diagonal-cross-grid'
  | 'solid-white'
  | 'solid-gray'
  | 'solid-blue'
  | 'dots'
  | 'dots-large'
  | 'dots-small'
  | 'dots-cross'
  | 'grid'
  | 'grid-small'
  | 'grid-large'
  | 'grid-thick'
  | 'grid-thin'
  | 'diagonal-lines'
  | 'vertical-lines'
  | 'horizontal-lines'
  | 'isometric-grid'
  | 'hexagonal-grid'
  | 'grid-spotlight'
  | 'waves'
  | 'custom'

export interface BackgroundConfig {
  type: BackgroundType
  color?: string
  size?: string
  customImage?: string
}

interface BackgroundContextType {
  background: BackgroundConfig
  setBackground: (config: BackgroundConfig) => void
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined)

const STORAGE_KEY = 'app_background_config'

const defaultBackground: BackgroundConfig = {
  type: 'solid-white',
  size: '40px'
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [background, setBackgroundState] = useState<BackgroundConfig>(defaultBackground)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setBackgroundState(parsed)
      }
    } catch (error) {
      console.error('Error loading background config:', error)
    }
  }, [])

  // Save to localStorage when background changes
  const setBackground = (config: BackgroundConfig) => {
    setBackgroundState(config)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      console.error('Error saving background config:', error)
    }
  }

  return (
    <BackgroundContext.Provider value={{ background, setBackground }}>
      {children}
    </BackgroundContext.Provider>
  )
}

export function useBackground() {
  const context = useContext(BackgroundContext)
  if (!context) {
    throw new Error('useBackground must be used within BackgroundProvider')
  }
  return context
}

