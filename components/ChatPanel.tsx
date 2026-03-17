"use client";

import { useRef, useEffect, useState } from "react";
import { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Send, Loader2, User, Bot } from "lucide-react";
import MechanismFeedback from "./MechanismFeedback";
import StatusLog from "./StatusLog";

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  statusLog: string[];
  onSendFollowUp: (text: string) => void;
}

export default function ChatPanel({
  messages,
  isLoading,
  statusLog,
  onSendFollowUp,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, statusLog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    onSendFollowUp(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-4 py-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div
                className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-0.5 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {msg.imageData && (
                  <img
                    src={msg.imageData}
                    alt="Mechanism drawing"
                    className="max-h-48 rounded-md border mb-2 bg-white"
                  />
                )}
                {msg.role === "assistant" ? (
                  <MechanismFeedback content={msg.content} />
                ) : (
                  msg.content && (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="space-y-1 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your mechanism...
                </div>
                {statusLog.length > 0 && (
                  <div className="ml-6">
                    <StatusLog entries={statusLog} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t p-3 flex gap-2 items-end max-w-3xl mx-auto w-full"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question..."
          rows={1}
          className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={!input.trim() || isLoading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
