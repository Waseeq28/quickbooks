"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, ShieldCheck, Zap } from "lucide-react"

export default function ConnectPage() {
  const handleConnect = () => {
    window.location.href = '/api/auth/quickbooks'
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
            Connect to QuickBooks Sandbox
          </Button>

          <div className="text-xs text-gray-500 text-center">
            You'll be redirected to QuickBooks to authorize access. 
            After connecting, you'll get credentials to paste in your .env.local file.
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 