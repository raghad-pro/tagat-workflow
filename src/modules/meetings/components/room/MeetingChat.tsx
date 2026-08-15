"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Send, Paperclip, FileText, Download, CheckSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/providers/AuthProvider";
import { useMeetingMessages, useSendMessage } from "../../hooks/useMeetings";
import { meetingsApi } from "../../api/meetings.api";
import ConvertToTaskModal from "./ConvertToTaskModal";
import type { MeetingMessage } from "../../types/meetings.types";

interface MeetingChatProps {
  meetingId: number | string;
}

export default function MeetingChat({ meetingId }: MeetingChatProps) {
  const t = useTranslations("meetings");
  const { user } = useAuth();
  const role = user?.role || "employee";

  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [convertingMessage, setConvertingMessage] = useState<MeetingMessage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useMeetingMessages(meetingId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = messageText.trim();
    if (!cleanText && !attachment) return;

    sendMessage(
      {
        meetingId,
        payload: {
          message: cleanText,
          attachment: attachment || undefined,
        },
      },
      {
        onSuccess: () => {
          setMessageText("");
          setAttachment(null);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b bg-muted/20 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <span>{t("roomTabs.chat")}</span>
          <span className="text-xs text-muted-foreground font-normal">
            ({messages.length} رسالة)
          </span>
        </h3>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
            <p className="text-sm">لا توجد رسائل حتى الآن.</p>
            <p className="text-xs mt-1">ابدأ المحادثة بمشاركة أول رسالة في الاجتماع!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 group ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                <Avatar className="w-8 h-8 shrink-0 mt-0.5 border">
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {(msg.user?.name || "ع").charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`flex flex-col max-w-[80%] ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{msg.user?.name || "مشارك"}</span>
                    <span>
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>

                  <div
                    className={`relative p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-current/20 space-y-1">
                        {msg.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={meetingsApi.getAttachmentDownloadUrl(role, att.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-1.5 rounded bg-black/10 hover:bg-black/20 text-xs transition-colors"
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate flex-1">{att.file_name}</span>
                            <Download className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Convert Message to Task Action */}
                  <button
                    onClick={() => setConvertingMessage(msg)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary cursor-pointer"
                    title="تحويل لمهمة"
                  >
                    <CheckSquare className="w-3 h-3" />
                    <span>{t("chat.convertToTask")}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Attachment Badge */}
      {attachment && (
        <div className="px-3 py-1.5 bg-muted/60 border-t flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <Paperclip className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">{attachment.name}</span>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="text-muted-foreground hover:text-destructive text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-2.5 border-t bg-background flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files?.[0]) setAttachment(e.target.files[0]);
          }}
          className="hidden"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
          title={t("chat.attachFile")}
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={t("chat.placeholder")}
          className="h-9 text-sm rounded-xl focus-visible:ring-primary/20"
        />

        <Button
          type="submit"
          size="icon"
          disabled={(!messageText.trim() && !attachment) || isSending}
          className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
        >
          <Send className="w-4 h-4 rtl:rotate-180" />
        </Button>
      </form>

      {/* Convert Message to Task Modal */}
      {convertingMessage && (
        <ConvertToTaskModal
          isOpen={Boolean(convertingMessage)}
          onClose={() => setConvertingMessage(null)}
          meetingId={meetingId}
          sourceType="message"
          sourceId={convertingMessage.id}
          defaultTitle={`مهمة من رسالة في الاجتماع`}
          defaultDescription={convertingMessage.message}
        />
      )}
    </div>
  );
}
