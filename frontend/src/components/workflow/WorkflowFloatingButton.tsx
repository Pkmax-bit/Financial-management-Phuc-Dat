'use client'

import { useState, useEffect } from 'react'
import { PlayCircle } from 'lucide-react'
import WorkflowPanel from './WorkflowPanel'

export default function WorkflowFloatingButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Check if panel should be open from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('workflow-panel-state')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Restore open state if panel was open (minimized or not)
          if (parsed.isOpen !== false) { // Default to true if not explicitly false
            setIsOpen(true)
            setIsMinimized(parsed.minimized || false)
          } else if (parsed.minimized) {
            // If explicitly closed but minimized, still show minimized
            setIsOpen(true)
            setIsMinimized(true)
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }, [])

  // Listen for storage changes to sync state
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = () => {
      const saved = localStorage.getItem('workflow-panel-state')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setIsMinimized(parsed.minimized || false)
          // Update isOpen based on saved state
          if (parsed.isOpen !== false) {
            setIsOpen(true)
          } else if (!parsed.minimized) {
            setIsOpen(false)
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    // Listen for custom event when panel state changes
    window.addEventListener('workflow-panel-state-change', handleStorageChange)
    
    // Also check periodically (for same-tab updates and page navigation)
    const interval = setInterval(() => {
      handleStorageChange()
    }, 300)

    return () => {
      window.removeEventListener('workflow-panel-state-change', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  return (
    <>
      {/* Floating Button - Only show if panel is not open or is minimized */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
            // Update localStorage
            if (typeof window !== 'undefined') {
              const saved = localStorage.getItem('workflow-panel-state')
              if (saved) {
                try {
                  const parsed = JSON.parse(saved)
                  parsed.minimized = false
                  parsed.isOpen = true
                  localStorage.setItem('workflow-panel-state', JSON.stringify(parsed))
                  window.dispatchEvent(new Event('workflow-panel-state-change'))
                } catch (e) {
                  // Ignore
                }
              } else {
                // Create new state if doesn't exist
                const defaultState = {
                  x: window.innerWidth - 420,
                  y: 80,
                  width: 400,
                  height: 600,
                  minimized: false,
                  isOpen: true
                }
                localStorage.setItem('workflow-panel-state', JSON.stringify(defaultState))
                window.dispatchEvent(new Event('workflow-panel-state-change'))
              }
            }
          }}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
          aria-label="Mở quy trình"
          title="Xem quy trình quản lý tài chính"
        >
          <PlayCircle className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      )}

      {/* Panel - Always render if open, even when minimized */}
      {isOpen && (
        <WorkflowPanel 
          isOpen={isOpen} 
          onClose={() => {
            setIsOpen(false)
            setIsMinimized(false)
            // Save closed state to localStorage
            if (typeof window !== 'undefined') {
              const saved = localStorage.getItem('workflow-panel-state')
              if (saved) {
                try {
                  const parsed = JSON.parse(saved)
                  parsed.minimized = false
                  parsed.isOpen = false
                  localStorage.setItem('workflow-panel-state', JSON.stringify(parsed))
                  window.dispatchEvent(new Event('workflow-panel-state-change'))
                } catch (e) {
                  // Ignore
                }
              }
            }
          }} 
        />
      )}
    </>
  )
}

