"use client";

import type React from "react";

import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Bot, User, FileText, Zap, TrendingUp } from "lucide-react";
import type { UIMessage } from "ai";

interface ChatPanelProps {
  messages: UIMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatPanel({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="px-4 py-3 glass-effect border-b border-border/50">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-sm">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              QuickBooks AI
            </h2>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-3 space-y-3">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <Card className="border border-border/30 shadow-sm bg-gradient-to-br from-primary/5 to-purple-500/5">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-foreground">
                        Welcome! I'm your AI Assistant
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        I can help manage and analyze your QuickBooks invoices
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center space-x-2.5 p-2.5 bg-card/40 rounded-lg border border-border/20">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                          Fetch and view all invoices
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5 p-2.5 bg-card/40 rounded-lg border border-border/20">
                        <Zap className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                          Find specific invoices instantly
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5 p-2.5 bg-card/40 rounded-lg border border-border/20">
                        <TrendingUp className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                          Analyze data and get insights
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            {messages
              .filter((message) => {
                // Filter out empty messages or messages with no content
                if (typeof message.content === 'string') {
                  return message.content.trim().length > 0
                }
                return message.content !== null && message.content !== undefined
              })
              .map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2.5 rounded-xl ${
                    message.role === "user"
                      ? "bg-primary/10 text-primary-foreground shadow-sm border border-primary/20"
                      : "bg-muted/50 border border-border/30 shadow-sm text-foreground"
                  }`}
                >
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    message.role === "user" ? "text-foreground" : "text-foreground"
                  }`}>
                    {typeof message.content === "string"
                      ? message.content
                      : JSON.stringify(message.content)}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="flex items-start justify-center w-7 h-7 bg-primary/10 rounded-lg flex-shrink-0 mt-1 border border-primary/20">
                    <User className="h-3.5 w-3.5 text-primary mt-1.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="px-3 py-2.5 bg-muted/50 border border-border/30 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium ml-2">
                      AI is thinking
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator className="bg-border/30" />

      {/* Input Area */}
      <div className="p-3 glass-effect space-y-2.5">
        <form onSubmit={handleFormSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything about your invoices..."
            disabled={isLoading}
            className="flex-1 bg-input border-border/50 focus:border-primary/50 placeholder:text-muted-foreground/60 text-sm h-9"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            className="shadow-sm h-9"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleInputChange({
                target: { value: "Fetch all invoices from QuickBooks" },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            disabled={isLoading}
            className="text-xs font-medium hover:bg-primary/10 hover:border-primary/30 hover:text-primary h-7 px-2.5"
          >
            Fetch Invoices
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleInputChange({
                target: { value: "Show me all overdue invoices" },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            disabled={isLoading}
            className="text-xs font-medium hover:bg-red-900/20 hover:border-red-500/30 hover:text-red-400 h-7 px-2.5"
          >
            Overdue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleInputChange({
                target: { value: "What is the total amount pending?" },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            disabled={isLoading}
            className="text-xs font-medium hover:bg-amber-900/20 hover:border-amber-500/30 hover:text-amber-400 h-7 px-2.5"
          >
            Pending Total
          </Button>
        </div>
      </div>
    </div>
  );
}
