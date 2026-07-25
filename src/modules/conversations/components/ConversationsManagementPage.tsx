"use client";

import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useConversations, useConversation } from "../hooks/useConversations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User as UserIcon, Plus, Info, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ConversationsManagementPage() {
  const { user } = useAuth();
  const role = user?.role || "company";
  const t = useTranslations();
  
  const [activeConversationId, setActiveConversationId] = useState<number | string | null>(null);
  const [messageBody, setMessageBody] = useState("");

  const {
    data: conversationsRes,
    isLoading: isConversationsLoading,
  } = useConversations(role);

  const {
    data: activeConversationData,
    isLoading: isChatLoading,
  } = useConversation(role, activeConversationId);

  const { sendMessage, isSendingMessage } = useConversations(role);

  const conversations = conversationsRes?.data || [];
  const activeConversation = activeConversationData?.data; // Depends on how getOne returns data

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || !activeConversationId) return;

    try {
      await sendMessage({ id: activeConversationId, body: messageBody });
      setMessageBody("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] w-full border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm mt-4">
      {/* Sidebar: Chat List */}
      <div className="w-1/3 border-r dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-950">
        <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <h2 className="text-lg font-bold">{t("sidebar.conversations")}</h2>
          <Button variant="ghost" size="icon">
            <Plus size={20} />
          </Button>
        </div>
        <div className="p-3 border-b dark:border-slate-800">
          <Input placeholder="Search conversations..." className="bg-white dark:bg-slate-900" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isConversationsLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">No conversations found.</div>
          ) : (
            conversations.map((conv: any) => (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  activeConversationId === conv.id ? "bg-slate-200 dark:bg-slate-800" : ""
                }`}
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 rounded-full flex items-center justify-center shrink-0">
                  <UserIcon size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-semibold text-sm truncate">{conv.name || "Conversation"}</h4>
                  <p className="text-xs text-slate-500 truncate mt-1">
                    {conv.last_message?.body || "No messages yet"}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <div className="bg-[var(--color-btn-brand)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {conv.unread_count}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Area: Chat Window */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {activeConversationId ? (
          <>
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 rounded-full flex items-center justify-center">
                  <UserIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{activeConversation?.name || "Chat"}</h3>
                  <p className="text-xs text-green-500">Online</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Info size={20} className="text-slate-500" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900">
              {isChatLoading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">Loading messages...</div>
              ) : activeConversation?.messages?.length > 0 ? (
                activeConversation.messages.map((msg: any) => {
                  const isMine = msg.user_id === user?.id; // Determine if message is from current user
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                          isMine
                            ? "bg-[var(--color-btn-brand)] text-white rounded-tr-sm"
                            : "bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-tl-sm shadow-sm"
                        }`}
                      >
                        <p>{msg.body}</p>
                        <span className={`text-[10px] block mt-1 text-right ${isMine ? "text-indigo-100" : "text-slate-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  Say hi to start the conversation!
                </div>
              )}
            </div>

            <div className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full px-4"
                  disabled={isSendingMessage}
                />
                <Button 
                  type="submit" 
                  className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-[var(--color-btn-brand)] text-white shrink-0"
                  disabled={!messageBody.trim() || isSendingMessage}
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-medium">Select a conversation</h3>
            <p className="text-sm">Choose a conversation from the list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
