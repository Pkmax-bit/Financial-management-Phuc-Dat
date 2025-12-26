import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function authMiddleware(request: NextRequest) {
  try {
    // Try to get token from Authorization header first (for API calls from service)
    const authHeader = request.headers.get('authorization')

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get: () => null, // Don't use cookies for header-based auth
          },
        }
      )

      // Verify the token
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return { error: 'Invalid token' }
      }

      return { user }
    }

    // Fallback to cookie-based auth for direct API calls
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { error: 'Unauthorized' }
    }

    return { user }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return { error: 'Authentication failed' }
  }
}
