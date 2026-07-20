"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Send, X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  who: "bot" | "user";
}

interface Suggestion {
  id: string;
  text: string;
}

const API_URL = "";

export function Chatbot() {
  const t = useTranslations("landing.chatbot");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages or typing state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      
      // Fallback translations in case not defined in next-intl yet
      const defaultGreeting = isRtl 
        ? "أهلاً! 👋 أنا مساعد النظام. كيف أساعدك اليوم؟" 
        : "Hi! 👋 I'm the assistant. How can I help you today?";
        
      const defaultSuggestions = isRtl
        ? [
            { id: "what", text: "ما هي الميزات؟" },
            { id: "pricing", text: "ما هي باقات الأسعار؟" },
            { id: "start", text: "كيف أبدأ؟" }
          ]
        : [
            { id: "what", text: "What are the features?" },
            { id: "pricing", text: "What is the pricing?" },
            { id: "start", text: "How do I start?" }
          ];

      setMessages([{ id: "msg-0", text: defaultGreeting, who: "bot" }]);
      setSuggestions(defaultSuggestions);

      // Fetch suggestions from backend
      fetch(`/api/suggestions?lang=${locale}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.suggestions && !hasAsked) {
            setSuggestions(data.suggestions);
          }
          if (data?.greeting) {
            setMessages((prev) => [
              { id: "msg-0", text: data.greeting, who: "bot" }
            ]);
          }
        })
        .catch(() => console.error("Chatbot backend offline."));
    }
    
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, hasGreeted, locale, hasAsked]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setHasAsked(true);
    setSuggestions([]);
    
    const newMsg: Message = { id: Date.now().toString(), text: trimmed, who: "user" };
    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, lang: locale })
      });

      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: data.answer, who: "bot" }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now().toString(), 
          text: isRtl ? "المساعد غير متاح حالياً. يرجى المحاولة لاحقاً." : "The assistant is unavailable right now. Please try again later.", 
          who: "bot" 
        }
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div
      className={`fixed bottom-6 z-[99999] ${
        isRtl ? "right-6" : "left-6"
      }`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-20 flex flex-col w-[350px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-140px)] bg-white dark:bg-[#12141a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden ${
              isRtl ? "right-0" : "left-0"
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-[#22c8e0] text-white shadow-md">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-white">
                  {isRtl ? "مساعد النظام" : "System Assistant"}
                </h3>
                <p className="text-xs text-white/90">
                  {isRtl ? "متصل - اسألني أي شيء" : "Online - Ask me anything"}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/25 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/50 dark:bg-[#070c12]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[85%] p-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.who === "bot"
                      ? "bg-white dark:bg-[#141b22] text-slate-800 dark:text-slate-100 rounded-2xl self-start shadow-sm border border-slate-200/80 dark:border-slate-800/80 font-normal"
                      : "bg-[#22c8e0] text-white rounded-2xl self-end shadow-md font-medium"
                  }`}
                  style={
                    isRtl
                      ? {
                          borderTopRightRadius: msg.who === "bot" ? "0.25rem" : "1rem",
                          borderTopLeftRadius: msg.who === "user" ? "0.25rem" : "1rem",
                        }
                      : {
                          borderTopLeftRadius: msg.who === "bot" ? "0.25rem" : "1rem",
                          borderTopRightRadius: msg.who === "user" ? "0.25rem" : "1rem",
                        }
                  }
                >
                  {msg.text}
                </div>
              ))}

              {isTyping && (
                <div className="bg-white dark:bg-[#141b22] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 self-start shadow-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-[#22c8e0] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-[#22c8e0] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-[#22c8e0] rounded-full animate-bounce"></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-3 pb-3 flex flex-wrap gap-2 bg-slate-50/50 dark:bg-[#070c12]">
                {suggestions.map((sug) => (
                  <button
                    key={sug.id}
                    onClick={() => handleSend(sug.text)}
                    className="text-xs px-3 py-1.5 rounded-full border border-[#22c8e0]/40 text-[#22c8e0] bg-[#22c8e0]/10 hover:bg-[#22c8e0] hover:text-white transition-all font-medium"
                  >
                    {sug.text}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="flex items-center gap-2 p-3 bg-white dark:bg-[#0d141c] border-t border-slate-200/80 dark:border-slate-800/80"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isRtl ? "اكتب رسالتك هنا..." : "Type your message..."}
                maxLength={1000}
                className="flex-1 min-w-0 bg-slate-100 dark:bg-[#161d24] text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-400 rounded-full px-4 py-2.5 text-sm font-medium outline-none border border-slate-200 dark:border-slate-700/60 focus:border-[#22c8e0] focus:ring-2 focus:ring-[#22c8e0]/30 transition-all"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-[#22c8e0] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Send className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center bg-[#22c8e0] text-white shadow-[0_10px_30px_rgba(34,200,224,0.45)] hover:scale-105 active:scale-95 transition-transform"
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#22c8e0] opacity-40 animate-ping [animation-duration:2.5s]"></span>
        )}
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-7 h-7 text-white" />}
      </button>
    </div>
  );
}
