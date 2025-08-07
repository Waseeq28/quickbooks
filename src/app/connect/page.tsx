"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, ShieldCheck, Zap, User } from "lucide-react"
import { useRouter } from 'next/navigation'

export default function ConnectPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    
    getUser()
  }, [supabase])

  const handleConnect = () => {
    if (!user) {
      router.push('/login')
      return
    }
    window.location.href = '/api/auth/quickbooks'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Connect to QuickBooks
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Connect your QuickBooks sandbox account to start managing invoices with AI
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {user && (
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Signed in as</p>
                <p className="text-sm text-green-600">{user.email}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Zap className="w-4 h-4 text-green-500" />
              <span>Secure OAuth 2.0 connection</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Zap className="w-4 h-4 text-green-500" />
              <span>Sandbox environment (test data)</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Zap className="w-4 h-4 text-green-500" />
              <span>Real-time invoice management</span>
            </div>
          </div>

          <Button 
            onClick={handleConnect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
            size="lg"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            {user ? 'Connect to QuickBooks Sandbox' : 'Sign in to Connect'}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            {user ? (
              <>You'll be redirected to QuickBooks to authorize access. 
              After connecting, your credentials will be securely stored.</>
            ) : (
              <>Please sign in with Google first to connect your QuickBooks account.</>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 