"use client";

import type React from "react";

import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Bot, User, Loader2, Sparkles, Zap, TrendingUp } from "lucide-react";
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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
              <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-200 rounded-xl blur-lg opacity-60 animate-pulse"></div>
            <div className="relative flex items-center justify-center w-10 h-10 bg-cyan-100 rounded-xl shadow-md">
              <Bot className="h-5 w-5 text-cyan-700" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-600">
              AI Assistant
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Powered by QuickBooks Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <Card className="border-0 shadow-lg bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-xl shadow-md flex-shrink-0 animate-float">
                      <Bot className="h-6 w-6 text-cyan-700" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">
                          Welcome! I'm your AI Assistant 👋
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          I can help you manage and analyze your QuickBooks invoices
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="flex items-center space-x-3 p-2.5 bg-white/60 rounded-lg">
                                                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            Fetch and view all invoices
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 p-2.5 bg-white/60 rounded-lg">
                                                      <div className="flex items-center justify-center w-8 h-8 bg-cyan-100 rounded-lg">
                              <Zap className="h-4 w-4 text-cyan-700" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            Find specific invoices instantly
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 p-2.5 bg-white/60 rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            Analyze data and get insights
                          </span>
                        </div>
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
                {message.role === "assistant" && (
                  <div className="flex items-start justify-center w-8 h-8 bg-cyan-100 rounded-lg shadow-sm flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-cyan-700 mt-1.5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-blue-100 text-blue-900 shadow-md"
                      : "bg-gray-50 border border-gray-200 shadow-sm text-gray-900"
                  }`}
                >
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    message.role === "user" ? "text-blue-900" : "text-gray-900"
                  }`}>
                    {typeof message.content === "string"
                      ? message.content
                      : JSON.stringify(message.content)}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="flex items-start justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0 mt-1">
                    <User className="h-4 w-4 text-blue-700 mt-1.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex items-start justify-center w-8 h-8 bg-cyan-100 rounded-lg shadow-sm flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-cyan-700 mt-1.5" />
                </div>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 font-medium ml-2">
                      AI is thinking
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator className="bg-gray-200" />

      {/* Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-sm space-y-3">
        <form onSubmit={handleFormSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything about your invoices..."
            disabled={isLoading}
            className="flex-1 bg-white/70 border-primary/20 focus:border-primary/40 placeholder:text-muted-foreground/60"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="shadow-md"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleInputChange({
                target: { value: "Fetch all invoices from QuickBooks" },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            disabled={isLoading}
            className="text-xs font-medium hover:bg-primary/5 hover:border-primary/30"
          >
            <Sparkles className="h-3 w-3 mr-1.5" />
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
            className="text-xs font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-700"
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
            className="text-xs font-medium hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
          >
            Pending Total
          </Button>
        </div>
      </div>
    </div>
  );
}
