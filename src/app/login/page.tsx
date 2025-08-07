"use client"

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome, ShieldCheck, Zap } from "lucide-react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Error signing in with Google:', error.message)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to QuickBooks AI
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Sign in to manage your invoices with AI assistance
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Zap className="w-4 h-4 text-green-500" />
              <span>Secure Google authentication</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Zap className="w-4 h-4 text-green-500" />
              <span>AI-powered invoice management</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Zap className="w-4 h-4 text-green-500" />
              <span>QuickBooks integration</span>
            </div>
          </div>

          <Button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 py-3 text-lg font-semibold"
            size="lg"
          >
            <Chrome className="w-5 h-5 mr-2 text-blue-500" />
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            By signing in, you agree to connect your Google account and 
            authorize access to manage your QuickBooks data.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}