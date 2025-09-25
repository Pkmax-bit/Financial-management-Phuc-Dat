import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
      <body className={`${inter.className} bg-gray-50`}>
        {children}
      </body>
    </html>
  )
}