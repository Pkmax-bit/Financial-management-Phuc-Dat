'use client'

import { usePathname } from 'next/navigation'
import MultiChatBubbles from './chat/MultiChatBubbles'

interface FloatingActionsButtonProps {
  currentUserId: string
}

export default function FloatingActionsButton({ currentUserId }: FloatingActionsButtonProps) {
  const pathname = usePathname()

  if (pathname === '/chat') {
    return null
  }

  return (
    <>
      {/* Multi Chat Bubbles - Always visible */}
      <MultiChatBubbles currentUserId={currentUserId} />
    </>
  )
}

