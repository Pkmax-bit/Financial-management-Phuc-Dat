import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/animations.css'
import 'shepherd.js/dist/css/shepherd.css'
import BackgroundProviderWrapper from '@/components/BackgroundProviderWrapper'
import QueryProvider from '@/providers/QueryProvider'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'QuickBooks - Hệ thống quản lý tài chính',
  description: 'Hệ thống quản lý tài chính toàn diện với Next.js và FastAPI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryProvider>
            <BackgroundProviderWrapper>
              {children}
            </BackgroundProviderWrapper>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}