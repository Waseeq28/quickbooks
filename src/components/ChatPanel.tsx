"use client";

import type React from "react";

import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Bot, User, Loader2 } from "lucide-react";
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
      <div className="px-6 py-4 border-b border-border/40">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              AI Assistant
            </h2>
            <p className="text-sm text-muted-foreground">
              Ask questions about your invoices or request actions
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
              <Card className="border-primary/20 bg-accent/30">
                <CardContent className="px-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="font-medium text-foreground">
                        Hello! I'm your QuickBooks AI assistant
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0"></div>
                          <span className="text-sm text-muted-foreground">
                            Fetch all invoices from QuickBooks
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0"></div>
                          <span className="text-sm text-muted-foreground">
                            Find specific invoices by ID
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0"></div>
                          <span className="text-sm text-muted-foreground">
                            Analyze invoice data and provide insights
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-start justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 mt-1" />
                  </div>
                )}

                <Card
                  className={`max-w-[85%] ${
                    message.role === "user"
                      ? "bg-primary border-primary/20"
                      : "bg-accent/30 border-border/50"
                  }`}
                >
                  <CardContent
                    className={`px-4 ${
                      message.role === "user"
                        ? "text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {typeof message.content === "string"
                        ? message.content
                        : JSON.stringify(message.content)}
                    </p>
                  </CardContent>
                </Card>

                {message.role === "user" && (
                  <div className="flex items-start justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground flex-shrink-0 mt-1">
                    <User className="h-4 w-4 mt-1" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex items-start justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 mt-1" />
                </div>
                <Card className="bg-accent/30 border-border/50">
                  <CardContent className="px-4">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground font-medium">
                        AI is thinking...
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator className="border-border/40" />

      {/* Input Area */}
      <div className="p-4 space-y-4">
        <form onSubmit={handleFormSubmit} className="flex space-x-3">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about invoices or request an action..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
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
            className="text-xs"
          >
            Fetch All Invoices
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
            className="text-xs"
          >
            Overdue Invoices
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
            className="text-xs"
          >
            Pending Total
          </Button>
        </div>
      </div>
    </div>
  );
}
