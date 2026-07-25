"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, User as UserIcon, MessageSquarePlus, Users, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { employeeApi } from "@/modules/employees/api/employees.api";
import { clientApi } from "@/modules/clients/api/clients.api";
import { useAuth } from "@/providers/AuthProvider";

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: number | string, name: string) => void;
  isCreating: boolean;
}

function getUserName(item: any): string {
  return (
    item.employee_name ??
    item.employeeName ??
    item.name ??
    item.user?.name ??
    (item.user?.first_name ? `${item.user.first_name} ${item.user.last_name ?? ""}`.trim() : null) ??
    item.email ??
    "User"
  );
}

function getUserEmail(item: any): string {
  return item.email ?? item.user?.email ?? "";
}

function getUserId(item: any): number | string {
  return item.user_id ?? item.user?.id ?? item.id;
}

function getClientStatus(item: any): string {
  const status = item.status ?? item.pivot?.status ?? item.companies?.[0]?.pivot?.status ?? "pending";
  return String(status).toLowerCase();
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
  const [activeTab, setActiveTab] = useState<"employees" | "clients">("employees");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Employees
  const { data: employeesRes, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["employees", role],
    queryFn: () => employeeApi.getAll(role),
    enabled: isOpen,
  });

  // 2. Fetch Clients
  const { data: clientsRes, isLoading: isClientsLoading } = useQuery({
    queryKey: ["clients", role, "all"],
    queryFn: () => clientApi.getAll({ per_page: 100 }, role),
    enabled: isOpen,
  });

  // Normalize Employees
  const rawEmployees = employeesRes?.data || [];
  const employeesList = Array.isArray(rawEmployees) ? rawEmployees : rawEmployees.data || [];

  // Normalize & Filter Approved Clients
  const rawClientsPayload = (clientsRes as any)?.data || clientsRes || [];
  const rawClients = Array.isArray(rawClientsPayload)
    ? rawClientsPayload
    : rawClientsPayload.data || [];

  const approvedClientsList = rawClients.filter((c: any) => {
    const s = getClientStatus(c);
    return s === "approved" || s === "active";
  });

  const activeList = activeTab === "employees" ? employeesList : approvedClientsList;

  const filteredList = activeList.filter((item: any) => {
    const name = getUserName(item).toLowerCase();
    const email = getUserEmail(item).toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return name.includes(q) || email.includes(q);
  });

  const isLoading = activeTab === "employees" ? isEmployeesLoading : isClientsLoading;

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">بدء محادثة جديدة / Start Chat</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs: Employees vs Approved Clients */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1.5 gap-1 mx-6 mt-4 rounded-xl border">
          <button
            type="button"
            onClick={() => setActiveTab("employees")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "employees"
                ? "bg-white dark:bg-slate-800 text-[#00d0d4] shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Users size={14} />
            <span>الموظفين ({employeesList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("clients")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "clients"
                ? "bg-white dark:bg-slate-800 text-[#00d0d4] shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <UserCheck size={14} />
            <span>العملاء المقبولين ({approvedClientsList.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-6 pb-2 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder={activeTab === "employees" ? "البحث عن موظف..." : "البحث عن عميل مقبول..."} 
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
              جاري التحميل...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              {activeTab === "employees"
                ? `لم يتم العثور على موظفين ${searchQuery ? `يطابقون "${searchQuery}"` : ""}`
                : `لا يوجد عملاء مقبولين/موثقين حالياً ${searchQuery ? `يطابقون "${searchQuery}"` : ""}`}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredList.map((item: any) => {
                const name = getUserName(item);
                const email = getUserEmail(item);
                const targetId = getUserId(item);

                return (
                  <div 
                    key={targetId} 
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-[#00d0d4]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} 
                          alt={name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-[14px] text-slate-800 dark:text-white truncate">
                            {name}
                          </h4>
                          {activeTab === "clients" && (
                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              مقبول
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-slate-500 truncate">
                          {email}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      disabled={isCreating}
                      onClick={() => onStartChat(targetId, name)}
                      className="shrink-0 bg-[#eaf9f9] text-[#00d0d4] hover:bg-[#00d0d4] hover:text-white rounded-full h-8 px-[#12px] font-semibold text-xs border-none transition-colors group"
                    >
                      <MessageSquarePlus size={14} className="mr-1.5 group-hover:text-white text-[#00d0d4]" />
                      محادثة
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
