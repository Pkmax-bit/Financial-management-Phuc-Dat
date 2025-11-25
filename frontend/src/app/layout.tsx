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

              {/* Dify Chatbot */}
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                window.difyChatbotConfig = {
                  token: 'P2wx7PzPhhTT1S0U',
                  inputs: {
                    // You can define the inputs from the Start node here
                    // key is the variable name
                    // e.g.
                    // name: "NAME"
                  },
                  systemVariables: {
                    // user_id: 'YOU CAN DEFINE USER ID HERE',
                    // conversation_id: 'YOU CAN DEFINE CONVERSATION ID HERE, IT MUST BE A VALID UUID',
                  },
                  userVariables: {
                    // avatar_url: 'YOU CAN DEFINE USER AVATAR URL HERE',
                    // name: 'YOU CAN DEFINE USER NAME HERE',
                  },
                }
              `
                }}
              />
              <script
                src="https://udify.app/embed.min.js"
                id="P2wx7PzPhhTT1S0U"
                defer
              />
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                #dify-chatbot-bubble-button {
                  background-color: #1C64F2 !important;
                }
                #dify-chatbot-bubble-window {
                  width: 24rem !important;
                  height: 40rem !important;
                }
              `
                }}
              />
            </BackgroundProviderWrapper>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}