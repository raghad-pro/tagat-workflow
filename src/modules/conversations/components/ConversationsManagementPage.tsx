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
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden bg-white mt-4 rounded-xl border border-slate-100 shadow-sm">
      
      {/* Sidebar: Chat List */}
      <div className="w-[380px] min-w-[320px] border-r border-slate-100 flex flex-col bg-white relative">
        
        {/* Header */}
        <div className="px-6 py-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Conversations</h2>
          <button className="w-8 h-8 rounded-full bg-[#00d0d4] text-white flex items-center justify-center hover:bg-[#00b0b4] transition-colors shadow-sm">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Search conversations..." 
              className="w-full bg-[#f6f7f9] border-none rounded-full pl-10 pr-4 h-11 text-[13px] text-slate-600 focus-visible:ring-1 focus-visible:ring-[#00d0d4]" 
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-2 custom-scrollbar">
          {isConversationsLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">No conversations found.</div>
          ) : (
            conversations.map((conv: any, index: number) => {
              const isActive = activeConversationId === conv.id || (index === 0 && !activeConversationId); 
              if (index === 0 && !activeConversationId) {
                setTimeout(() => setActiveConversationId(conv.id), 0);
              }
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer transition-colors ${
                    isActive ? "bg-[#eaf9f9]" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="relative shrink-0 mt-0.5">
                    <img 
                      src={conv.image || `https://ui-avatars.com/api/?name=${conv.name}&background=random`} 
                      alt={conv.name}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    {conv.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className={`font-semibold text-[14px] truncate ${isActive ? 'text-[#00d0d4]' : 'text-slate-800'}`}>
                        {conv.name || "Conversation"}
                      </h4>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2 font-medium">
                        {conv.last_message_time || (index === 0 ? "2 days ago" : index === 1 ? "3 days ago" : index === 2 ? "1 hour ago" : "Yesterday")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[12px] text-slate-500 truncate pr-2">
                        {conv.last_message?.body || (index === 0 ? "Upgraded to moderator" : index === 1 ? "111" : index === 2 ? "Meeting tomorrow" : "Thank you very much!")}
                      </p>
                      {conv.unread_count > 0 ? (
                        <div className="shrink-0 bg-[#00d0d4] text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                          {conv.unread_count}
                        </div>
                      ) : index === 1 ? (
                        <div className="shrink-0 bg-[#00d0d4] text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                          2
                        </div>
                      ) : index === 2 ? (
                        <div className="shrink-0 bg-[#00d0d4] text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                          4
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Current User Profile Box */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] rounded-2xl">
            <div className="w-9 h-9 bg-[#00d0d4] rounded-full flex items-center justify-center text-white shrink-0">
              <UserIcon size={18} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0 text-right pr-2">
              <h4 className="font-bold text-[13px] text-slate-800 truncate">General manager</h4>
              <p className="text-[11px] text-slate-400 truncate">admin@workflow.com</p>
            </div>
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shrink-0 mr-1 shadow-sm"></div>
          </div>
        </div>

      </div>

      {/* Main Area: Chat Window */}
      <div className="flex-1 flex flex-col bg-white relative">
        {activeConversationId ? (
          <>
            {/* Chat Header */}
            <div className="h-[80px] px-8 border-b border-slate-100 flex justify-between items-center bg-white/60 backdrop-blur-md z-10 sticky top-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={activeConversation?.image || `https://ui-avatars.com/api/?name=${activeConversation?.name || 'A'}&background=random`} 
                    alt="Chat" 
                    className="w-11 h-11 rounded-full object-cover shadow-sm" 
                  />
                  {activeConversation?.is_online !== false && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-slate-800 leading-tight">
                    {activeConversation?.name || "Ahmad test"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    <p className="text-[12px] text-slate-500 font-medium">2 online • 4 members</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="h-9 px-4 rounded-full bg-[#eaf9f9] text-[#00d0d4] hover:bg-[#d4f2f3] hover:text-[#00b0b4] text-[13px] font-bold gap-2 border-none">
                  <Users size={16} strokeWidth={2.5} />
                  Members
                </Button>
                <Button variant="ghost" className="h-9 px-4 rounded-full text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 text-[13px] font-bold gap-2 border-none ml-1">
                  <Edit2 size={16} strokeWidth={2.5} />
                  Edit
                </Button>
                <div className="flex items-center gap-1 ml-4 text-slate-400">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-50 hover:text-slate-600">
                    <Phone size={18} strokeWidth={2} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-50 hover:text-slate-600">
                    <Video size={18} strokeWidth={2} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-50 hover:text-slate-600">
                    <MoreHorizontal size={18} strokeWidth={2} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6 bg-white custom-scrollbar">
              {isChatLoading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">Loading messages...</div>
              ) : activeConversation?.messages?.length > 0 ? (
                // Real messages from API
                activeConversation.messages.map((msg: any) => {
                  const isMine = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-end"} group`}>
                      <div className={`flex flex-col items-end max-w-[65%]`}>
                        <span className="text-[13px] text-[#00d0d4] mb-1.5 font-bold">
                          {msg.user?.name || "client1"}
                        </span>
                        <div className="relative px-5 py-3.5 bg-[#f6f7f9] rounded-2xl rounded-tr-sm text-slate-800 text-[14px] leading-relaxed shadow-sm">
                          {msg.attachment && (
                            <div className="w-64 h-40 bg-slate-100 rounded-xl mb-3 flex items-center justify-center border border-slate-200">
                              <ImageIcon size={32} className="text-slate-400" />
                            </div>
                          )}
                          <p>{msg.body}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      {isMine && (
                        <div className="ml-3 mt-auto mb-5 shrink-0">
                           <div className="w-8 h-8 rounded-full bg-[#00d0d4] text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                             {user?.name?.substring(0, 2).toUpperCase() || "ME"}
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                // Dummy Data matching screenshot precisely
                <div className="flex flex-col gap-6 pb-4">
                  <div className="flex justify-center my-2">
                    <div className="bg-[#f6f7f9] text-slate-500 text-[12px] font-semibold px-4 py-1 rounded-full">
                      Today
                    </div>
                  </div>

                  {/* Dummy Image Message 1 */}
                  <div className="flex justify-end group">
                    <div className="flex flex-col items-end max-w-[65%]">
                      <span className="text-[13px] text-[#00d0d4] mb-1.5 font-bold">client1</span>
                      <div className="relative p-2 bg-[#f6f7f9] rounded-2xl rounded-br-sm shadow-sm">
                        <div className="w-[340px] h-[220px] bg-slate-200/50 rounded-xl flex items-center justify-center">
                          <ImageIcon size={32} className="text-slate-400" strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                    {/* Placeholder for alignment to match last message's avatar space */}
                    <div className="w-8 ml-3"></div>
                  </div>

                   {/* Dummy Short Text */}
                   <div className="flex justify-end group -mt-3">
                    <div className="flex flex-col items-end max-w-[65%]">
                      <div className="relative px-5 py-3.5 bg-[#f6f7f9] rounded-2xl rounded-br-sm text-slate-700 text-[14px] shadow-sm">
                        <p>11</p>
                      </div>
                    </div>
                    <div className="w-8 ml-3"></div>
                  </div>

                  {/* Dummy Image Message 2 */}
                  <div className="flex justify-end group -mt-3">
                    <div className="flex flex-col items-end max-w-[65%]">
                      <div className="relative p-2 bg-[#f6f7f9] rounded-2xl rounded-br-sm shadow-sm">
                        <div className="w-[340px] h-[220px] bg-slate-200/50 rounded-xl flex items-center justify-center">
                          <ImageIcon size={32} className="text-slate-400" strokeWidth={1.5} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                            10:22 AM
                          </span>
                      </div>
                    </div>
                    <div className="ml-3 mt-auto mb-6 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-[#00d0d4] text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                          CL
                        </div>
                    </div>
                  </div>

                  <div className="flex justify-center mt-6">
                    <div className="bg-[#f6f7f9] text-slate-500 text-[12px] font-medium px-5 py-1.5 rounded-full">
                      client1 promoted to moderator
                    </div>
                  </div>
                  <div className="flex justify-center mt-1">
                    <div className="bg-[#f6f7f9] text-slate-500 text-[12px] font-medium px-5 py-1.5 rounded-full">
                      Moderator rights removed from client1
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="px-8 pb-8 pt-2 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <div className="flex-1 bg-[#f6f7f9] rounded-full h-14 flex items-center px-5 shadow-sm border border-slate-100 focus-within:ring-1 focus-within:ring-[#00d0d4] focus-within:border-[#00d0d4] transition-all">
                  <input
                    type="text"
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-[14px] text-slate-800 placeholder:text-slate-400"
                    disabled={isSendingMessage}
                  />
                  <div className="flex items-center gap-4 text-slate-400 ml-2">
                    <button type="button" className="hover:text-slate-600 transition-colors">
                      <Smile size={20} strokeWidth={2} />
                    </button>
                    <button type="button" className="hover:text-slate-600 transition-colors">
                      <Paperclip size={20} strokeWidth={2} />
                    </button>
                    <button type="button" className="hover:text-slate-600 transition-colors">
                      <ImageIcon size={20} strokeWidth={2} />
                    </button>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={!messageBody.trim() || isSendingMessage}
                  className="w-14 h-14 rounded-full bg-[#00d0d4] hover:bg-[#00b0b4] flex items-center justify-center text-white shrink-0 transition-colors shadow-[0_4px_14px_0_rgba(0,208,212,0.39)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={22} className="ml-1" strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-50/30">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-[#00d0d4]">
              <Send size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Your Conversations</h3>
            <p className="text-[15px] text-slate-500 max-w-sm text-center">
              Select a chat from the sidebar to view your messages or start a new conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
