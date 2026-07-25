"use client";

import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useConversations, useConversation } from "../hooks/useConversations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, User as UserIcon, Plus, Search, 
  Users, Edit2, Phone, Video, MoreHorizontal, 
  Smile, Paperclip, Image as ImageIcon
} from "lucide-react";
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
  const activeConversation = activeConversationData?.data;

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
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden bg-white dark:bg-slate-900 shadow-sm mt-4 rounded-xl border border-slate-100 dark:border-slate-800">
      
      {/* Sidebar: Chat List */}
      <div className="w-[380px] min-w-[320px] border-r border-slate-100 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-950">
        
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Conversations</h2>
          <button className="w-8 h-8 rounded-full bg-[#00d0d4] text-white flex items-center justify-center hover:bg-[#00b0b4] transition-colors shadow-sm">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Search conversations..." 
              className="w-full bg-[#f8f9fa] dark:bg-slate-800 border-none rounded-full pl-9 pr-4 h-10 text-sm focus-visible:ring-1 focus-visible:ring-[#00d0d4]" 
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scrollbar">
          {isConversationsLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">No conversations found.</div>
          ) : (
            conversations.map((conv: any) => {
              const isActive = activeConversationId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${
                    isActive ? "bg-[#e5f8f9] dark:bg-cyan-950/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="relative shrink-0 mt-1">
                    <img 
                      src={conv.image || `https://ui-avatars.com/api/?name=${conv.name}&background=random`} 
                      alt={conv.name}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    {/* Status Dot Example */}
                    {conv.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className={`font-semibold text-[15px] truncate ${isActive ? 'text-[#005a60] dark:text-cyan-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {conv.name || "Conversation"}
                      </h4>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2 font-medium">
                        {conv.last_message_time || "2 days ago"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[13px] text-slate-500 truncate pr-2">
                        {conv.last_message?.body || "Upgraded to moderator"}
                      </p>
                      {conv.unread_count > 0 && (
                        <div className="shrink-0 bg-[#00d0d4] text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center">
                          {conv.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Current User Profile Box */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex items-center gap-3 p-3 bg-[#f8f9fa] dark:bg-slate-800 rounded-2xl">
            <div className="w-10 h-10 bg-[#00d0d4] rounded-full flex items-center justify-center text-white shrink-0">
              <UserIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">General manager</h4>
              <p className="text-xs text-slate-500 truncate">admin@workflow.com</p>
            </div>
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full shrink-0 mr-1"></div>
          </div>
        </div>

      </div>

      {/* Main Area: Chat Window */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0f172a] relative">
        {activeConversationId ? (
          <>
            {/* Chat Header */}
            <div className="h-[76px] px-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={activeConversation?.image || `https://ui-avatars.com/api/?name=${activeConversation?.name || 'A'}&background=random`} 
                    alt="Chat" 
                    className="w-10 h-10 rounded-full object-cover" 
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white leading-tight">
                    {activeConversation?.name || "Ahmad test"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <p className="text-xs text-slate-500 font-medium">2 online • 4 members</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="h-8 px-3 rounded-full bg-[#e5f8f9] text-[#00d0d4] hover:bg-[#d0f0f1] hover:text-[#00b0b4] text-xs font-semibold gap-1.5 border-none">
                  <Users size={14} />
                  Members
                </Button>
                <Button variant="ghost" className="h-8 px-3 rounded-full text-green-500 hover:text-green-600 hover:bg-green-50 text-xs font-semibold gap-1.5 border-none">
                  <Edit2 size={14} />
                  Edit
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700">
                  <Phone size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700">
                  <Video size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700">
                  <MoreHorizontal size={16} />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 bg-white dark:bg-[#0f172a] custom-scrollbar">
              {isChatLoading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">Loading messages...</div>
              ) : activeConversation?.messages?.length > 0 ? (
                activeConversation.messages.map((msg: any) => {
                  const isMine = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
                      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[65%]`}>
                        {!isMine && (
                          <span className="text-xs text-[#00d0d4] mb-1 font-medium">{msg.user?.name || "client1"}</span>
                        )}
                        <div
                          className={`relative p-3.5 text-[14px] leading-relaxed ${
                            isMine
                              ? "bg-[#f8f9fa] dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-[20px] rounded-br-sm border border-slate-100 dark:border-slate-700"
                              : "bg-[#f8f9fa] dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-[20px] rounded-bl-sm border border-slate-100 dark:border-slate-700"
                          }`}
                        >
                          {msg.attachment && (
                            <div className="w-full h-40 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2 flex items-center justify-center">
                              <ImageIcon size={32} className="text-slate-400" />
                            </div>
                          )}
                          <p>{msg.body}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      {isMine && (
                        <div className="ml-2 mt-auto">
                           <div className="w-7 h-7 rounded-full bg-[#00d0d4] text-white flex items-center justify-center text-[10px] font-bold">
                             {user?.name?.substring(0, 2).toUpperCase() || "ME"}
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                // Dummy Data to match screenshot if API has no messages
                <div className="flex flex-col gap-6">
                  <div className="flex justify-center">
                    <div className="bg-[#f8f9fa] dark:bg-slate-800 text-slate-500 text-xs font-semibold px-4 py-1.5 rounded-full">
                      Today
                    </div>
                  </div>

                  {/* Dummy Image Message (Mine) */}
                  <div className="flex justify-end group">
                    <div className="flex flex-col items-end max-w-[65%]">
                      <span className="text-xs text-[#00d0d4] mb-1 font-medium">client1</span>
                      <div className="relative p-2 bg-[#f8f9fa] dark:bg-slate-800 rounded-[20px] rounded-br-sm border border-slate-100 dark:border-slate-700">
                        <div className="w-64 h-40 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                          <ImageIcon size={28} className="text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                   {/* Dummy Short Text (Mine) */}
                   <div className="flex justify-end group">
                    <div className="flex flex-col items-end max-w-[65%]">
                      <div className="relative px-4 py-2.5 bg-[#f8f9fa] dark:bg-slate-800 rounded-[20px] rounded-br-sm border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm">
                        <p>11</p>
                      </div>
                    </div>
                  </div>

                  {/* Dummy Image Message 2 (Mine) */}
                  <div className="flex justify-end group">
                    <div className="flex flex-col items-end max-w-[65%]">
                      <div className="relative p-2 bg-[#f8f9fa] dark:bg-slate-800 rounded-[20px] rounded-br-sm border border-slate-100 dark:border-slate-700">
                        <div className="w-64 h-40 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                          <ImageIcon size={28} className="text-slate-400" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-medium">
                            10:22 AM
                          </span>
                      </div>
                    </div>
                    <div className="ml-2 mt-auto mb-5">
                        <div className="w-7 h-7 rounded-full bg-[#00d0d4] text-white flex items-center justify-center text-[10px] font-bold">
                          CL
                        </div>
                    </div>
                  </div>

                  <div className="flex justify-center mt-2">
                    <div className="bg-[#f8f9fa] dark:bg-slate-800 text-slate-500 text-[11px] font-medium px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
                      client1 promoted to moderator
                    </div>
                  </div>
                  <div className="flex justify-center mt-1">
                    <div className="bg-[#f8f9fa] dark:bg-slate-800 text-slate-500 text-[11px] font-medium px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
                      Moderator rights removed from client1
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#f8f9fa] dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-full h-12 flex items-center px-4 border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-1 focus-within:ring-[#00d0d4] focus-within:border-[#00d0d4]">
                  <input
                    type="text"
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-800 dark:text-white"
                    disabled={isSendingMessage}
                  />
                  <div className="flex items-center gap-3 text-slate-400">
                    <button type="button" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      <Smile size={18} />
                    </button>
                    <button type="button" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      <Paperclip size={18} />
                    </button>
                    <button type="button" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      <ImageIcon size={18} />
                    </button>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={!messageBody.trim() || isSendingMessage}
                  className="w-12 h-12 rounded-full bg-[#00d0d4] hover:bg-[#00b0b4] flex items-center justify-center text-white shrink-0 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} className="ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-[#f8f9fa]/50 dark:bg-[#0f172a]">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-[#00d0d4]">
              <Send size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">Your Conversations</h3>
            <p className="text-sm text-slate-500 max-w-sm text-center">
              Select a chat from the sidebar to view your messages or start a new conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
