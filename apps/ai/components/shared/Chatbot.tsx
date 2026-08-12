"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageCircle, X, Send, ChevronDown } from "lucide-react";

// Local keyword-matching FAQ bot — no backend/API call, just routes visitors
// to the right page for anything beyond these basics.
const KNOWLEDGE_BASE = [
  {
    question: "How do I log in or access my account?",
    answer: "Click Login in the top navigation and enter your email and password. Forgot it? Use the Reset Password link on the login page.",
    keywords: ["login", "log in", "sign in", "access account", "signin"],
  },
  {
    question: "How do I book a demo?",
    answer: "Visit the Contact page and choose \"Book a demo\" as the inquiry type — our team will follow up within one business day.",
    keywords: ["demo", "book demo", "schedule demo", "live demo", "demo request"],
  },
  {
    question: "Where can I contact support?",
    answer: "Use the Contact page, or email info@xobriq.com directly for anything urgent.",
    keywords: ["contact", "support", "email", "help", "reach"],
  },
  {
    question: "Where is my data processed?",
    answer: "Xobriq's infrastructure is based in Nairobi, and we support sovereign-tier deployments where customer data never leaves Kenya.",
    keywords: ["data processed", "data location", "where is data", "nairobi", "sovereign", "residency"],
  },
  {
    question: "How do I find pricing information?",
    answer: "Pricing is scoped to your volume and needs — visit the Pricing page and request a custom quote.",
    keywords: ["pricing", "price", "cost", "plans"],
  },
  {
    question: "What products does Xobriq offer?",
    answer: "Guard (fraud & identity), Agentic AI (autonomous workflows), Cloud (sovereign GPU compute), Consult (AI strategy), and Cyber (managed security). Each has its own page in the Products menu.",
    keywords: ["services", "offer", "products", "guard", "cloud", "consult", "cyber", "agentic"],
  },
  {
    question: "Where can I see your privacy policy?",
    answer: "Our Privacy Policy is linked in the footer, or you can go straight to xobriq.com/privacy.",
    keywords: ["privacy", "privacy policy", "gdpr", "data policy"],
  },
  {
    question: "Where can I read the terms of service?",
    answer: "Terms of Service are linked in the footer, or head to xobriq.com/terms.",
    keywords: ["terms", "terms of service", "tos", "agreement"],
  },
  {
    question: "Are you hiring?",
    answer: "We're always open to exceptional talent — check the Careers page for current fit and how to reach out.",
    keywords: ["careers", "hiring", "job", "jobs", "apply", "work at xobriq"],
  },
];

function findAnswer(message: string): string {
  const query = message.toLowerCase();
  const match = KNOWLEDGE_BASE.find((item) => item.keywords.some((k) => query.includes(k)));
  return match ? match.answer : "Thanks for reaching out — please email info@xobriq.com and we'll get back to you.";
}

type Message = {
  sender: "bot" | "user";
  text: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    sender: "bot",
    text: "Hi! I'm Xobriq Assist. Ask me about login, demos, pricing, products, or policies.",
  },
];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    // Only auto-focus on desktop devices (width >= 768px and non-touch) to avoid popping up native mobile keyboard
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768 && !("ontouchstart" in window);
    if (isDesktop) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [open, messages, typing]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || typing) return;

    const userMsg: Message = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setTyping(true);

    setTimeout(() => {
      const answer = findAnswer(query);
      setMessages((prev) => [...prev, { sender: "bot", text: answer }]);
      setTyping(false);
    }, 600);
  };

  const openChat = () => {
    setOpen(true);
  };

  const suggestions = KNOWLEDGE_BASE.filter(
    (kb) => !messages.some((m) => m.text === kb.question)
  ).slice(0, 4);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
            className="mb-4 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:border-white/20 dark:bg-[#0c0d14] dark:text-white dark:shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(0,114,196,0.15)]"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-white/10 dark:bg-[#121420]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0072c4] text-white shadow-sm">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Xobriq Assist</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{typing ? "Typing…" : "Usually replies instantly"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200 dark:text-zinc-400 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} aria-live="polite" className="max-h-[420px] min-h-[240px] space-y-3 overflow-y-auto bg-white px-4 py-4 dark:bg-[#0c0d14]">
              {messages.map((message, i) => (
                <motion.div
                  key={message.sender + "-" + i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={"flex items-end gap-2 " + (message.sender === "bot" ? "justify-start" : "flex-row-reverse")}
                >
                  {message.sender === "bot" ? (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0072c4]/15 text-[#0072c4] dark:bg-[#0072c4]/25 dark:text-[#38bdf8]">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                  <div
                    className={
                      "max-w-[240px] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm " +
                      (message.sender === "bot"
                        ? "rounded-bl-md bg-slate-100 text-slate-900 dark:bg-[#181a28] dark:text-slate-100"
                        : "rounded-br-md bg-[#0072c4] text-white")
                    }
                  >
                    {message.text}
                  </div>
                </motion.div>
              ))}

              {typing ? (
                <div className="flex items-end gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0072c4]/15 text-[#0072c4] dark:bg-[#0072c4]/25 dark:text-[#38bdf8]">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex items-center gap-1 rounded-3xl rounded-bl-md bg-slate-100 px-4 py-3.5 dark:bg-[#181a28]">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-zinc-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-zinc-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-zinc-400" />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick Suggestions Chips */}
            {suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 px-4 pt-3 pb-2 dark:border-white/10 dark:bg-[#10121d]">
                {suggestions.map((item) => (
                  <button
                    key={item.question}
                    type="button"
                    onClick={() => handleSend(item.question)}
                    disabled={typing}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#0072c4]/50 hover:bg-[#0072c4]/10 hover:text-[#0072c4] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#181a28] dark:text-zinc-300 dark:hover:border-[#0072c4]/60 dark:hover:bg-[#0072c4]/20 dark:hover:text-white"
                  >
                    {item.question}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Input Bar */}
            <div className="flex gap-2 border-t border-slate-200 bg-slate-50 p-3.5 dark:border-white/10 dark:bg-[#10121d]">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0072c4] dark:border-white/15 dark:bg-[#161826] dark:text-white dark:focus:border-[#0072c4]"
                placeholder="Ask a question..."
              />
              <button
                type="button"
                onClick={() => handleSend(input)}
                disabled={!input.trim() || typing}
                aria-label="Send message"
                className="flex items-center justify-center rounded-full bg-[#0072c4] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#005ea2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={() => (open ? setOpen(false) : openChat())}
        className={
          "glow-hover flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-xl transition " +
          (open
            ? "bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            : "bg-[#0072c4] text-white hover:bg-[#005ea2]")
        }
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        {open ? "Minimize" : "Chat"}
      </motion.button>
    </div>
  );
}
