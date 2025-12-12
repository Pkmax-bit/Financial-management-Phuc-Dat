'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayCircle } from 'lucide-react'
import WorkflowPanel from './WorkflowPanel'

export default function WorkflowFloatingButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Load position and panel state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('workflow-panel-state')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Restore position
          if (parsed.buttonX !== undefined && parsed.buttonY !== undefined) {
            setPosition({ x: parsed.buttonX, y: parsed.buttonY })
          } else {
            // Default position: bottom right
            const defaultX = window.innerWidth - 80
            const defaultY = window.innerHeight - 100
            setPosition({ x: defaultX, y: defaultY })
          }
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
      } else {
        // Default position: bottom right
        const defaultX = window.innerWidth - 80
        const defaultY = window.innerHeight - 100
        setPosition({ x: defaultX, y: defaultY })
      }
    }
  }, [])

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return // Only handle left mouse button
    
    e.preventDefault()
    setIsDragging(true)
    setHasMoved(false)
    setDragStartPos({ x: e.clientX, y: e.clientY })
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      // Calculate offset from mouse position to button's top-left corner
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  // Handle drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const buttonWidth = 56 // button width (p-4 = 16px * 2 + icon 24px)
      const buttonHeight = 56 // button height
      
      // Mark as moved if mouse moved more than 5px from start position
      const movedDistance = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
      )
      if (movedDistance > 5) {
        setHasMoved(true)
      }
      
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // Constrain to viewport
      const maxX = window.innerWidth - buttonWidth
      const maxY = window.innerHeight - buttonHeight
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false)
      const buttonWidth = 56
      const buttonHeight = 56
      
      // Calculate final position
      const finalX = e.clientX - dragOffset.x
      const finalY = e.clientY - dragOffset.y
      
      // Constrain to viewport
      const maxX = window.innerWidth - buttonWidth
      const maxY = window.innerHeight - buttonHeight
      const constrainedX = Math.max(0, Math.min(finalX, maxX))
      const constrainedY = Math.max(0, Math.min(finalY, maxY))
      
      // Update position state
      setPosition({ x: constrainedX, y: constrainedY })
      
      // Save position to localStorage
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('workflow-panel-state')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            parsed.buttonX = constrainedX
            parsed.buttonY = constrainedY
            localStorage.setItem('workflow-panel-state', JSON.stringify(parsed))
          } catch (e) {
            // Ignore
          }
        } else {
          const defaultState = {
            buttonX: constrainedX,
            buttonY: constrainedY,
            x: window.innerWidth - 420,
            y: 80,
            width: 400,
            height: 600,
            minimized: false,
            isOpen: false
          }
          localStorage.setItem('workflow-panel-state', JSON.stringify(defaultState))
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, position])

  // Handle window resize to keep button in viewport
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      const buttonWidth = 56
      const buttonHeight = 56
      const maxX = window.innerWidth - buttonWidth
      const maxY = window.innerHeight - buttonHeight
      
      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, maxX)),
        y: Math.max(0, Math.min(prev.y, maxY))
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
          // Update position if changed
          if (parsed.buttonX !== undefined && parsed.buttonY !== undefined) {
            const buttonWidth = 56
            const buttonHeight = 56
            const maxX = window.innerWidth - buttonWidth
            const maxY = window.innerHeight - buttonHeight
            setPosition({ 
              x: Math.max(0, Math.min(parsed.buttonX, maxX)), 
              y: Math.max(0, Math.min(parsed.buttonY, maxY))
            })
          }
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
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            // Only trigger onClick if not dragging and hasn't moved
            if (!isDragging && !hasMoved) {
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
                    buttonX: position.x,
                    buttonY: position.y,
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
            }
            setHasMoved(false)
          }}
          className={`fixed z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group ${
            isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-110'
          }`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: isDragging ? 'scale(1.05)' : undefined
          }}
          aria-label="Mở quy trình"
          title="Kéo để di chuyển, click để mở quy trình"
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

