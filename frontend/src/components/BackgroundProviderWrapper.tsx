'use client'

import { BackgroundProvider } from '@/contexts/BackgroundContext'

export default function BackgroundProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <BackgroundProvider>{children}</BackgroundProvider>
}

