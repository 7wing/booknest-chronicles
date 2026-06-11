import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from the URL
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (!code) {
          setError('No authorization code received. Please try signing in again.')
          setIsProcessing(false)
          return
        }

        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('Auth callback error:', exchangeError)
          setError(exchangeError.message || 'Failed to complete authentication. Please try again.')
          setIsProcessing(false)
          return
        }

        // Successfully authenticated, redirect to home
        if (data.session) {
          navigate('/')
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
        setError('An unexpected error occurred. Please try again.')
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [navigate])

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-heading font-bold mb-2">Authentication Failed</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}