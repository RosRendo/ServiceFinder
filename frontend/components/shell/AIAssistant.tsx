"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "ai";
  content: string;
}

const SUGGESTIONS = [
  "Show today's revenue",
  "Why did revenue drop?",
  "Which staff performed badly?",
  "Predict next week revenue",
  "How many disputes this month?",
  "Which customer spent most?",
  "Generate monthly report",
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate AI response (replace with actual API call)
    await new Promise((r) => setTimeout(r, 1200));
    const mockResponses: Record<string, string> = {
      "show today's revenue": "Today's revenue is **$4,280** across 38 completed bookings. That's up **12%** vs yesterday ($3,820).",
      "why did revenue drop?": "Revenue dropped 8% last week primarily because **3 top staff members** (John, Maria, Chen) had sick days simultaneously on Thursday, reducing capacity.",
      "which staff performed badly?": "The bottom 3 performers this month by rating are: **Alex (★3.8)**, **Sam (★4.0)**, and **Nadia (★4.1)**. Alex has had 4 customer complaints about late arrivals.",
      "predict next week revenue": "Based on booking trends and historical patterns, next week's projected revenue is **$28,400–$31,200**. Expect higher demand Friday–Sunday.",
      "how many disputes this month?": "**7 disputes** were opened this month. 5 were resolved in favor of the customer (refunded), 1 in favor of the company, and 1 is still open.",
      "which customer spent most?": "**Rendo (Customer #1048)** has the highest lifetime value at **$1,240** across 18 bookings. Their most frequent service is Deep Cleaning.",
      "generate monthly report": "I'm generating the July 2026 summary report... It will be ready to download in your Reports section momentarily.",
    };

    const matched = Object.entries(mockResponses).find(([k]) =>
      text.toLowerCase().includes(k)
    );
    const aiContent = matched
      ? matched[1]
      : `I analyzed your data for "${text}". This feature will connect to your live backend to provide real-time insights. For now, check the Revenue and Analytics sections for detailed breakdowns.`;

    setMessages((prev) => [...prev, { role: "ai", content: aiContent }]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 h-11 pl-3 pr-4 rounded-full",
          "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-elevated",
          "hover:scale-105 transition-all duration-200 group",
          open && "hidden"
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-semibold">AI</span>
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[560px] flex flex-col rounded-2xl border border-border bg-background shadow-elevated overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-violet-600/10 to-indigo-600/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">ServiceFinder AI</p>
              <p className="text-[11px] text-muted-foreground">Ask anything about your data</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center py-2">Quick questions:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border/60 text-foreground hover:bg-muted/60 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "ai" && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] px-3 py-2 rounded-xl text-sm",
                      msg.role === "user"
                        ? "bg-violet-600 text-white"
                        : "bg-muted text-foreground"
                    )}
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n/g, "<br/>"),
                    }}
                  />
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="flex gap-1 px-3 py-2 rounded-xl bg-muted">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask AI anything..."
              className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
