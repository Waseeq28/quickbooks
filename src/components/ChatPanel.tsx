"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Send, Bot, User, Loader2 } from "lucide-react"
import type { UIMessage } from 'ai'

interface ChatPanelProps {
  messages: UIMessage[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function ChatPanel({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSubmit(e)
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
                      Hello! I&apos;m your AI assistant for invoice management. I can help you:
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
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
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
                onClick={() => handleInputChange({ 
                  target: { value: "Show me all overdue invoices" } 
                } as React.ChangeEvent<HTMLInputElement>)}
                disabled={isLoading}
              >
                Overdue Invoices
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleInputChange({ 
                  target: { value: "What is the total amount pending?" } 
                } as React.ChangeEvent<HTMLInputElement>)}
                disabled={isLoading}
              >
                Pending Total
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleInputChange({ 
                  target: { value: "Send reminder for INV-002" } 
                } as React.ChangeEvent<HTMLInputElement>)}
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