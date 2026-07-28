"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, UserPlus, UserMinus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: any;
}

export default function GroupMembersModal({ isOpen, onClose, conversation }: GroupMembersModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const members = conversation?.users || conversation?.members || [];

  const getRoleBadge = (pivotRole: string) => {
    switch (pivotRole) {
      case 'owner':
      case 'admin':
        return <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold">Owner</span>;
      case 'moderator':
        return <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">Moderator</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold">Member</span>;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Group Members</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">{members.length} Members</p>
            </div>
          </div>
          
          <Button className="bg-[#eaf9f9] text-[#00d0d4] hover:bg-[#00d0d4] hover:text-white border-none shadow-none font-bold rounded-full h-10 px-6 transition-colors flex items-center gap-2">
            <UserPlus size={16} strokeWidth={2.5} />
            Add Member
          </Button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-4">
            {members.map((member: any, idx: number) => {
              const name = member.name || member.first_name || "User";
              const pivotRole = member.pivot?.role || "member";
              const bgColor = idx % 3 === 0 ? 'bg-orange-400' : idx % 3 === 1 ? 'bg-blue-400' : 'bg-purple-500';

              return (
                <div key={member.id} className="flex items-center justify-between py-2 group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-[46px] h-[46px] rounded-full text-white font-bold flex items-center justify-center text-sm ${bgColor}`}>
                        {name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 dark:text-white text-[15px]">{name}</span>
                      {getRoleBadge(pivotRole)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 px-4 h-9 rounded-full border border-slate-200 text-slate-600 text-[13px] font-bold hover:bg-slate-50 transition-colors">
                      Member
                      <ChevronDown size={14} className="text-slate-400" />
                    </button>
                    <button className="flex items-center gap-1.5 px-4 h-9 rounded-full border border-rose-100 text-rose-500 bg-rose-50/50 hover:bg-rose-50 text-[13px] font-bold transition-colors">
                      <UserMinus size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
