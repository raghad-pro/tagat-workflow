"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useMeetingMessages, useSendMessage } from "../../hooks/useMeetings";
import MeetingAttachment from "./MeetingAttachment";
import ConvertToTaskModal from "./ConvertToTaskModal";
import type { MeetingMessage } from "../../types/meetings.types";
import { useMeetingUserDirectory } from "../../hooks/useMeetingUserDirectory";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface MeetingChatProps {
  meetingId: number | string;
}

export default function MeetingChat({ meetingId }: MeetingChatProps) {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [convertTaskMessage, setConvertTaskMessage] = useState<MeetingMessage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [localOptimisticMessages, setLocalOptimisticMessages] = useState<MeetingMessage[]>([]);

  const { data: serverMessages = [], isLoading } = useMeetingMessages(meetingId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { resolveName } = useMeetingUserDirectory(meetingId);

  const allMessages = React.useMemo(() => {
    const serverIds = new Set(serverMessages.map((m: any) => m.id));
    const pending = localOptimisticMessages.filter((m) => !serverIds.has(m.id));
    return [...serverMessages, ...pending];
  }, [serverMessages, localOptimisticMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text && !selectedFile) return;

    const tempMsg: MeetingMessage = {
      id: Date.now(),
      meeting_id: Number(meetingId),
      user_id: user?.id || 0,
      user: {
        id: user?.id || 0,
        name: user?.name || "Super Admin",
        avatar: user?.image || null,
      },
      message: text,
      created_at: new Date().toISOString(),
      attachments: selectedFile
        ? [
            {
              id: Date.now(),
              file_name: selectedFile.name,
              file_url: URL.createObjectURL(selectedFile),
            },
          ]
        : [],
    };

    setLocalOptimisticMessages((prev) => [...prev, tempMsg]);
    setInputText("");
    const fileToSend = selectedFile;
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    sendMessage(
      {
        meetingId,
        payload: {
          message: text,
          attachment: fileToSend || undefined,
        },
      },
      {
        onError: (err: any) => {
          toast.error("Failed to send message: " + (err?.message || "Server error"));
        },
      }
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "SA";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full rounded-[14px] bg-[#111827] border border-[#1F2937] overflow-hidden text-white">
      {/* ── Top Header matching Figma (chat) ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] bg-[#111827]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#25C6DA]" />
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#64748B]">
            chat
          </span>
        </div>
      </div>

      {/* ── Messages Stream ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 text-xs text-[#64748B] space-y-1">
            <MessageSquare className="w-8 h-8 opacity-40 mb-1" />
            <p className="text-[12px] font-medium text-[#475569]">No messages yet.</p>
          </div>
        ) : (
          allMessages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            const senderName = msg.user?.name || resolveName(msg.user_id);
            const initials = getInitials(senderName);

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-2.5 group",
                  isMe ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#1A2236] border border-[#2A3756] text-[#25C6DA] flex items-center justify-center text-[11px] font-bold shrink-0">
                  {initials}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "flex flex-col max-w-[78%] rounded-[14px] p-3 text-[13px] shadow-sm",
                    isMe
                      ? "bg-[#25C6DA] text-white rounded-tr-none"
                      : "bg-[#1A2236] text-white border border-[#2A3756] rounded-tl-none"
                  )}
                >
                  {!isMe && (
                    <span className="text-[11px] font-bold text-[#25C6DA] mb-0.5">
                      {senderName}
                    </span>
                  )}

                  {msg.message && (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </p>
                  )}

                  {/* Attachments if present */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {msg.attachments.map((att) => (
                        <MeetingAttachment
                          key={att.id}
                          attachment={att}
                          role={role}
                          isMine={isMe}
                        />
                      ))}
                    </div>
                  )}

                  {/* Message Footer */}
                  <div
                    className={cn(
                      "flex items-center justify-between gap-2 mt-1.5 text-[10px]",
                      isMe ? "text-white/80" : "text-[#64748B]"
                    )}
                  >
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {/* Convert to Task Button */}
                    <button
                      onClick={() => setConvertTaskMessage(msg)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:underline inline-flex items-center gap-1"
                      title="Convert to task"
                    >
                      <CheckSquare className="w-2.5 h-2.5" />
                      <span>Task</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar matching Figma exact styles ── */}
      <form onSubmit={handleSend} className="p-3 border-t border-[#1F2937] bg-[#111827]">
        {selectedFile && (
          <div className="flex items-center justify-between p-2 mb-2 rounded-[8px] bg-[#1A2236] border border-[#2A3756] text-xs text-white">
            <span className="truncate">{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-red-400 font-bold hover:underline"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-[37px] h-[37px] rounded-[10px] bg-[#1A2236] border border-[#2A3756] text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text Input matching Figma */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message..."
            className="flex-1 h-[37px] px-3.5 rounded-[10px] bg-[#1A2236] border border-[#2A3756] text-white text-[14px] placeholder:text-[#475569] focus:outline-none focus:border-[#25C6DA] transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSending || (!inputText.trim() && !selectedFile)}
            className="w-[37px] h-[37px] rounded-[10px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Convert message to task modal */}
      {convertTaskMessage && (
        <ConvertToTaskModal
          isOpen={Boolean(convertTaskMessage)}
          onClose={() => setConvertTaskMessage(null)}
          meetingId={meetingId}
          sourceType="message"
          sourceId={convertTaskMessage.id}
          defaultTitle={convertTaskMessage.message ? convertTaskMessage.message.slice(0, 50) : "مهمة من الشات"}
          defaultDescription={convertTaskMessage.message || ""}
        />
      )}
    </div>
  );
}
