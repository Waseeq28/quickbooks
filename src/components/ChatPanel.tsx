"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Send, Bot, User, Loader2, Wrench, CheckCircle, AlertCircle } from "lucide-react"

// Defined locally to avoid dependency on 'ai' package for UI-only implementation
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

interface ChatPanelProps {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  onToolExecution: (toolName: string, args: any) => void
}

interface ToolCall {
  id: string
  name: string
  args: any
  status: "executing" | "completed" | "error"
  result?: any
}

export function ChatPanel({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onToolExecution,
}: ChatPanelProps) {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, toolCalls])

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (input.toLowerCase().includes("invoice")) {
      const mockToolCall: ToolCall = {
        id: Date.now().toString(),
        name: "getInvoice",
        args: { invoiceId: "INV-001" },
        status: "executing",
      }
      setToolCalls((prev) => [...prev, mockToolCall])
      onToolExecution(mockToolCall.name, mockToolCall.args)

      setTimeout(() => {
        setToolCalls((prev) =>
          prev.map((tc) =>
            tc.id === mockToolCall.id ? { ...tc, status: "completed", result: { success: true } } : tc,
          ),
        )
      }, 2000)
    }

    handleSubmit(e)
  }

  const getToolIcon = (status: ToolCall["status"]) => {
    switch (status) {
      case "executing":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getToolStatusColor = (status: ToolCall["status"]) => {
    switch (status) {
      case "executing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
    }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <Card className="flex-1 flex flex-col border-0 shadow-none">
        <CardHeader className="pb-4 border-b border-border/40">
          <CardTitle className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight">AI Assistant</span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Ask questions about your invoices or request actions
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="flex items-start space-x-4 p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-3">
                      Hello! I'm your AI assistant for invoice management. I can help you:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                        <span>Find specific invoices</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                        <span>Update invoice status</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                        <span>Send invoice emails</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                        <span>Generate reports</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                        <span>Answer questions about your invoices</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-4 rounded-xl shadow-sm ${
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground ml-auto border border-primary/20" 
                        : "bg-accent/50 text-foreground border border-border/30"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Tool Calls */}
              {toolCalls.map((toolCall) => (
                <div key={toolCall.id} className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="flex-1 p-4 bg-orange-50/50 border border-orange-200/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getToolIcon(toolCall.status)}
                        <span className="text-sm font-semibold text-foreground">Tool: {toolCall.name}</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`${getToolStatusColor(toolCall.status)} border font-medium`}
                      >
                        {toolCall.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      <span className="font-medium">Arguments:</span> {JSON.stringify(toolCall.args)}
                    </p>
                    {toolCall.result && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Result:</span> {JSON.stringify(toolCall.result)}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-accent/30 border border-border/30 rounded-xl">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground font-medium">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator className="border-border/40" />

          {/* Input Form */}
          <div className="p-6">
            <form onSubmit={handleFormSubmit} className="flex space-x-3">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about invoices or request an action..."
                disabled={isLoading}
                className="flex-1 bg-background/50 border-border/50 focus:bg-background h-11"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="h-11 px-4 shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleInputChange({ target: { value: "Show me all overdue invoices" } } as any)}
                disabled={isLoading}
              >
                Overdue Invoices
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleInputChange({ target: { value: "What is the total amount pending?" } } as any)}
                disabled={isLoading}
              >
                Pending Total
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleInputChange({ target: { value: "Send reminder for INV-002" } } as any)}
                disabled={isLoading}
              >
                Send Reminder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 