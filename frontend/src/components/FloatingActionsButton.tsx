'use client'

import { usePathname } from 'next/navigation'

interface FloatingActionsButtonProps {
  currentUserId: string
}

export default function FloatingActionsButton({ currentUserId }: FloatingActionsButtonProps) {
  const pathname = usePathname()

  if (pathname === '/chat') {
    return null
  }

  // MultiChatBubbles component has been removed
  return null
}

