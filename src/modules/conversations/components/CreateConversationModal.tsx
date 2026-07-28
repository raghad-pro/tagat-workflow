"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { employeeApi } from "@/modules/employees/api/employees.api";
import { clientApi } from "@/modules/clients/api/clients.api";
import { companyApi } from "@/modules/companies/api/companies.api";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userIds: (number | string)[], type: "private" | "group", name?: string, imageFile?: File) => void;
  isCreating: boolean;
}

function getUserName(item: any): string {
  if (!item) return "User";
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

function getUserId(item: any): number | string {
  if (!item) return 0;
  return item.user_id ?? item.user?.id ?? item.id;
}

function getClientStatus(item: any): string {
  const status = item.status ?? item.pivot?.status ?? item.companies?.[0]?.pivot?.status ?? "pending";
  return String(status).toLowerCase();
}

function getRoleName(item: any): string {
  let role = item.role || item.user?.role || item.pivot?.role || item._defaultRole || "User";
  if (role.toLowerCase() === 'company') role = 'Admin';
  if (role.toLowerCase() === 'company_admin') role = 'Admin';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
}

function getCompanyName(item: any): string {
  if (item.isCompanyItem) return item.name;
  if (item.companies && item.companies.length > 0) return item.companies[0].name;
  if (item.company?.name) return item.company.name;
  if (item.company_name) return item.company_name;
  if (item.roles) {
    const roleWithCompany = item.roles.find((r: any) => r.company?.name);
    if (roleWithCompany) return roleWithCompany.company.name;
  }
  return "No Company";
}

export default function CreateConversationModal({
  isOpen,
  onClose,
  onStartChat,
  isCreating,
}: CreateConversationModalProps) {
  const { user } = useAuth();
  const role = user?.role || "company";
  const [mounted, setMounted] = useState(false);

  // Initialize with empty so only the select box shows at first
  const [conversationType, setConversationType] = useState<"private" | "group" | "">("");
  const [groupName, setGroupName] = useState("");
  const [groupPicture, setGroupPicture] = useState<File | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number | string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = 
    role === "super_admin" || 
    user?.role_id === 1 || 
    String(role).includes("admin") ||
    (user as any)?.roles?.some((r: any) => r.name === "super_admin" || r.id === 1);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setConversationType("");
      setSelectedUsers(new Set());
      setGroupName("");
      setGroupPicture(null);
    }
  }, [isOpen]);

  const { data: employeesRes, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["employees", role],
    queryFn: () => employeeApi.getAll(role),
    enabled: isOpen,
  });

  const { data: clientsRes, isLoading: isClientsLoading } = useQuery({
    queryKey: ["clients", role, "all"],
    queryFn: () => clientApi.getAll({ per_page: 100 }, role),
    enabled: isOpen,
  });

  const { data: companiesRes, isLoading: isCompaniesLoading } = useQuery({
    queryKey: ["companies", "all"],
    queryFn: () => companyApi.getAll({ per_page: 100 }),
    enabled: isOpen && isSuperAdmin,
  });

  const rawEmployees = employeesRes?.data || [];
  const employeesList = Array.isArray(rawEmployees) ? rawEmployees : rawEmployees.data || [];

  const rawClientsPayload = (clientsRes as any)?.data || clientsRes || [];
  const rawClients = Array.isArray(rawClientsPayload)
    ? rawClientsPayload
    : rawClientsPayload.data || [];

  const rawCompaniesPayload = companiesRes?.data || [];
  const rawCompanies = Array.isArray(rawCompaniesPayload) 
    ? rawCompaniesPayload 
    : (rawCompaniesPayload as any).data || [];

  const processedClients = isSuperAdmin 
    ? rawClients 
    : rawClients.filter((c: any) => {
        const s = getClientStatus(c);
        return s === "approved" || s === "active";
      });

  const allUsers = [
    ...(isSuperAdmin ? rawCompanies.map((c: any) => ({ ...c, _defaultRole: 'Company Admin', isCompanyItem: true })) : []),
    ...employeesList.map((e: any) => ({ ...e, _defaultRole: 'Employee' })),
    ...processedClients.map((c: any) => ({ ...c, _defaultRole: 'Client' }))
  ];
  const isLoading = isEmployeesLoading || isClientsLoading || (isSuperAdmin && isCompaniesLoading);

  // Group users by company
  const groupedUsers: Record<string, any[]> = {};
  allUsers.forEach((u) => {
    const comp = getCompanyName(u);
    if (!groupedUsers[comp]) groupedUsers[comp] = [];
    groupedUsers[comp].push(u);
  });

  const handleUserToggle = (id: number | string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (conversationType === "private") {
        newSet.clear();
        newSet.add(id);
      } else {
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      }
      return newSet;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setGroupPicture(e.target.files[0]);
    }
  };

  const handleSave = () => {
    if (selectedUsers.size === 0) return;
    if (conversationType === "group" && !groupName.trim()) return;

    const userIds = Array.from(selectedUsers);
    let finalName = groupName;
    if (conversationType === "private") {
      const targetUser = allUsers.find(u => getUserId(u) === userIds[0]);
      if (targetUser) finalName = getUserName(targetUser);
    }

    onStartChat(userIds, conversationType as "private" | "group", finalName, groupPicture || undefined);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/10 backdrop-blur-sm" 
      dir="ltr"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] mt-auto sm:mt-0"
        onMouseDown={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-5 sm:px-10 py-6 sm:py-8 pb-4 sm:pb-6 flex flex-col gap-1 shrink-0 bg-white z-10 border-b border-transparent">
          <div className="flex items-center gap-3 sm:gap-4 mb-1">
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-800 hover:bg-slate-100 rounded-full transition-colors shrink-0"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <h2 className="text-xl sm:text-[28px] font-bold text-slate-900 leading-tight">Create a new conversation</h2>
          </div>
          <p className="text-slate-500 font-medium pl-11 sm:pl-12 text-xs sm:text-sm">Choose type and participants</p>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-10 pb-6 sm:pb-8 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white">
          <div className="space-y-6">
            
            {/* Conversation Type */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">Conversation Type</label>
              <div className="relative">
                <Select
                  value={conversationType}
                  onValueChange={(value) => {
                    setConversationType(value as any);
                    setSelectedUsers(new Set());
                  }}
                >
                  <SelectTrigger className="w-full bg-white border border-slate-100 rounded-xl h-12 px-4 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#00d0d4] focus:border-[#00d0d4] hover:bg-slate-50 transition-colors [&>svg]:text-slate-400 [&>svg]:opacity-100 [&>svg]:w-4 [&>svg]:h-4">
                    <SelectValue placeholder="Select conversation type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl border border-slate-100 shadow-lg p-1 z-[150]">
                    <SelectItem value="private" className="py-2.5 px-3 rounded-lg text-sm cursor-pointer focus:bg-[#00d0d4]/10 focus:text-[#00d0d4] transition-colors">Personal Chat</SelectItem>
                    <SelectItem value="group" className="py-2.5 px-3 rounded-lg text-sm cursor-pointer focus:bg-[#00d0d4]/10 focus:text-[#00d0d4] transition-colors">Group name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rest of the form, only shown if conversationType is selected */}
            {conversationType && (
              <>
                {conversationType === "group" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">Group Name</label>
                      <input 
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Group name"
                        className="w-full bg-white border border-slate-100 rounded-xl h-12 px-4 text-sm text-slate-700 shadow-sm focus:outline-none focus:border-[#00d0d4]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">Group Picture</label>
                      <div className="flex items-center gap-2 sm:gap-3 border border-slate-100 rounded-xl p-1.5 bg-white shadow-sm overflow-hidden w-full">
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white border border-slate-100 text-slate-600 rounded-lg h-9 px-3 sm:px-4 font-medium text-xs sm:text-sm hover:bg-slate-50 transition-colors shrink-0"
                        >
                          Choose File
                        </button>
                        <span className="text-xs sm:text-sm text-slate-400 px-1 sm:px-2 truncate flex-1">
                          {groupPicture ? groupPicture.name : "No file chosen"}
                        </span>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          className="hidden" 
                          accept="image/*"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">Participants</label>
                  
                  <div className="border border-slate-100 rounded-xl py-3.5 px-4 flex items-center gap-2 mb-3 shadow-sm bg-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    <span className="text-[13px] font-medium text-slate-500">
                      {conversationType === 'private' 
                        ? 'Select one person for a personal chat.' 
                        : 'Select multiple people to create a group.'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="p-4 text-center text-slate-500 text-sm">Loading participants...</div>
                    ) : allUsers.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">No users found.</div>
                    ) : (
                      Object.entries(groupedUsers).map(([companyName, users], compIdx) => (
                        <div key={companyName} className="space-y-2 mb-6">
                          <div className="flex items-center gap-2 mb-3 mt-1">
                            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{companyName}</h4>
                            <div className="h-px bg-slate-200 flex-1"></div>
                          </div>
                          
                          <div className="space-y-2">
                            {users.map((item: any, idx: number) => {
                              const name = getUserName(item);
                              const targetId = getUserId(item);
                              const roleName = getRoleName(item);
                              const isSelected = selectedUsers.has(targetId);
                              
                              const bgColors = ['bg-[#6366f1]', 'bg-[#0ea5e9]', 'bg-[#a855f7]', 'bg-[#ec4899]', 'bg-[#f59e0b]'];
                              const bgColor = bgColors[(idx + compIdx) % bgColors.length];

                              return (
                                <div 
                                  key={`${targetId}-${idx}`}
                                  onClick={() => handleUserToggle(targetId)}
                                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                                    isSelected ? 'border-[#00d0d4] bg-[#eaf9f9]/30' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                                  }`}
                                >
                                  <div className="hidden sm:flex items-center justify-center w-5 h-5 ml-1 shrink-0 pointer-events-none">
                                    <input
                                      type={conversationType === 'private' ? 'radio' : 'checkbox'}
                                      checked={isSelected}
                                      readOnly
                                      className={`w-4 h-4 text-[#00d0d4] bg-white border-slate-200 focus:ring-[#00d0d4] ${conversationType === 'private' ? 'rounded-full' : 'rounded-sm'}`}
                                    />
                                  </div>
                                  
                                  <div className="relative shrink-0">
                                     <div className={`w-9 h-9 rounded-full text-white font-bold flex items-center justify-center text-[13px] ${bgColor}`}>
                                       {name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                     </div>
                                     {idx % 2 !== 0 && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
                                     )}
                                  </div>
                                  
                                  <span className="text-[13px] sm:text-[14px] font-bold text-slate-800 flex-1 truncate">{name}</span>

                                  <span className="bg-[#00d0d4]/10 text-[#00d0d4] text-[10px] sm:text-[11px] font-bold px-2 sm:px-3 py-1 rounded-full shrink-0 uppercase tracking-wider">
                                    {roleName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-6 flex items-center gap-3">
                  <Button 
                    onClick={handleSave}
                    disabled={isCreating || selectedUsers.size === 0 || (conversationType === 'group' && !groupName.trim())}
                    className="bg-[#00d0d4] hover:bg-[#00b0b4] text-white px-8 h-11 font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Send size={16} className="-ml-1" strokeWidth={2.5} />
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="px-8 h-11 font-bold border-slate-100 text-slate-800 hover:bg-slate-50 rounded-lg bg-[#f6f7f9] border-none"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
