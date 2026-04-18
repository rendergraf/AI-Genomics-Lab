'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dna, Lock, Mail } from 'lucide-react'
import api, { API_BASE_URL } from '@/lib/api'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken()
      if (!token) {
        setCheckingAuth(false)
        return
      }
      try {
        const result = await api.getCurrentUser()
        if (result.error) {
          throw new Error(result.error)
        }
        // User is already authenticated, redirect to home
        router.push('/')
      } catch (error) {
        api.removeToken()
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    console.log('API Base URL:', API_BASE_URL)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await api.login(email, password, rememberMe)
      if (result.error) {
        throw new Error(result.error)
      }
      if (!result.data) {
        throw new Error('No data received')
      }
      const { access_token } = result.data
      api.setToken(access_token)
      // Store token in secure cookie (handled by backend)
      // Redirect to settings page
      router.push('/settings')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Dna className="h-12 w-12 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">🧬 AI Genomics Lab</h1>
              <p className="text-muted-foreground mt-2">Secure access to genomic analysis platform</p>
            </div>
          </div>
        </div>

        {/* Login card */}
        <Card colorPalette="brand-blue" padding="lg">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5" />
                Sign In
              </div>
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="error">
                  {error}
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setError('Password reset functionality coming soon')}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                colorScheme="primary"
                size="xl"
                loading={isLoading}
                loadingText="Signing in..."
                className="w-full"
                disabled={isLoading}
              >
                Sign In
              </Button>
            </CardFooter>
           </form>
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-500">API Endpoint: {API_BASE_URL}</p>
          </div>
        </Card>

        {/* Additional info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            This is a scientific platform for internal use only.{' '}
            <button
              onClick={() => setError('User registration requires admin approval. Please contact your administrator.')}
              className="text-primary hover:underline"
            >
              Request access
            </button>
          </p>
          <p className="mt-2">
            By signing in, you agree to our{' '}
            <button
              onClick={() => setError('Terms of service documentation coming soon')}
              className="text-primary hover:underline"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              onClick={() => setError('Privacy policy documentation coming soon')}
              className="text-primary hover:underline"
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  )
}