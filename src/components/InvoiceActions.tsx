"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Download, RefreshCw, Check, AlertTriangle } from "lucide-react"

interface InvoiceActionsProps {
  invoiceId: string
  onDownloadPdf: (invoiceId: string) => Promise<void>
}

export function InvoiceActions({ invoiceId, onDownloadPdf }: InvoiceActionsProps) {
  const [emailToSend, setEmailToSend] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [sendEmailError, setSendEmailError] = useState<string | null>(null)
  const [sendEmailSuccess, setSendEmailSuccess] = useState<string | null>(null)

  const handleSendEmail = async () => {
    if (!emailToSend) {
      setSendEmailError("Please enter a recipient's email address.")
      return
    }

    setIsSendingEmail(true)
    setSendEmailError(null)
    setSendEmailSuccess(null)

    try {
      const response = await fetch(`/api/quickbooks/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      setSendEmailSuccess(result.message || "Email sent successfully!")
      setEmailToSend("")
    } catch (error: any) {
      setSendEmailError(error.message)
    } finally {
      setIsSendingEmail(false)
      // Clear messages after a few seconds
      setTimeout(() => {
        setSendEmailError(null)
        setSendEmailSuccess(null)
      }, 5000)
    }
  }

  return (
    <div className="pt-2.5 space-y-2.5 border-t border-border/30">
      <div className="flex items-end gap-2">
        <div className="flex-grow">
          <label htmlFor="emailForInvoice" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
            Email Invoice
          </label>
          <Input
            id="emailForInvoice"
            type="email"
            placeholder="Enter recipient email"
            value={emailToSend}
            onChange={(e) => setEmailToSend(e.target.value)}
            disabled={isSendingEmail}
            className="mt-1 bg-input border-border/50 focus:border-primary/50 text-sm h-9"
          />
        </div>
        
        <Button
          onClick={handleSendEmail}
          disabled={isSendingEmail || !emailToSend || !!sendEmailSuccess}
          className="gap-1.5 min-w-[90px] h-9"
          variant={sendEmailSuccess ? "secondary" : "default"}
          size="sm"
        >
          {isSendingEmail ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : sendEmailSuccess ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Mail className="h-3.5 w-3.5" />
          )}
          <span className="text-sm">
            {isSendingEmail ? 'Sending' : sendEmailSuccess ? 'Sent!' : 'Send'}
          </span>
        </Button>

        <Button 
          onClick={() => onDownloadPdf(invoiceId)}
          variant="outline"
          className="gap-1.5 h-9"
          size="sm"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="text-sm">PDF</span>
        </Button>
      </div>
      
      <div className="h-4">
        {sendEmailError && (
          <p className="text-xs text-red-400 flex items-center gap-1 pl-1">
            <AlertTriangle className="h-3 w-3" />
            {sendEmailError}
          </p>
        )}
        {sendEmailSuccess && (
          <p className="text-xs text-green-400 flex items-center gap-1 pl-1">
            <Check className="h-3 w-3" />
            {sendEmailSuccess}
          </p>
        )}
      </div>
    </div>
  )
}