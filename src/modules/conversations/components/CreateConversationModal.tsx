"use client";

import React, { useState } from "react";
import { X, Search, User as UserIcon, MessageSquarePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { employeeApi } from "@/modules/employees/api/employees.api";
import { useAuth } from "@/providers/AuthProvider";

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: number | string, name: string) => void;
  isCreating: boolean;
}

export default function CreateConversationModal({
  isOpen,
  onClose,
  onStartChat,
  isCreating,
}: CreateConversationModalProps) {
  const { user } = useAuth();
  const role = user?.role || "company";
  const [searchQuery, setSearchQuery] = useState("");

  const { data: employeesRes, isLoading } = useQuery({
    queryKey: ["employees", role],
    queryFn: () => employeeApi.getAll(role),
    enabled: isOpen,
  });

  const employees = employeesRes?.data || [];

  const filteredEmployees = employees.filter((emp: any) =>
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Start New Chat</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Search employees..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f6f7f9] dark:bg-slate-800 border-none rounded-full pl-10 pr-4 h-11 text-[13px] text-slate-600 dark:text-slate-200 focus-visible:ring-1 focus-visible:ring-[#00d0d4]" 
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-[#0f172a]">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#00d0d4] border-t-transparent rounded-full animate-spin"></div>
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No employees found matching "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEmployees.map((emp: any) => (
                <div 
                  key={emp.id} 
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-[#00d0d4]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${emp.name}&background=random`} 
                        alt={emp.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[14px] text-slate-800 dark:text-white truncate">
                        {emp.name}
                      </h4>
                      <p className="text-[12px] text-slate-500 truncate">
                        {emp.email}
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm"
                    disabled={isCreating}
                    onClick={() => onStartChat(emp.id, emp.name)}
                    className="shrink-0 bg-[#eaf9f9] text-[#00d0d4] hover:bg-[#00d0d4] hover:text-white rounded-full h-8 px-3 font-semibold text-xs border-none transition-colors group"
                  >
                    <MessageSquarePlus size={14} className="mr-1.5 group-hover:text-white text-[#00d0d4]" />
                    Chat
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
