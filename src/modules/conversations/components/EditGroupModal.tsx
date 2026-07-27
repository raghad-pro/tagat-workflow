"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: any;
}

export default function EditGroupModal({ isOpen, onClose, conversation }: EditGroupModalProps) {
  const [mounted, setMounted] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPicture, setGroupPicture] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (conversation) {
      setGroupName(conversation.title || conversation.name || "");
    }
  }, [conversation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setGroupPicture(e.target.files[0]);
    }
  };

  const handleSave = () => {
    // Implement API call to update group name/picture
    console.log("Saving changes:", { groupName, groupPicture });
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-8 py-6 flex flex-col gap-1 sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-transparent">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Group</h2>
          </div>
          <p className="text-sm text-slate-500 font-medium pl-12">Choose type and participants</p>
        </div>

        {/* Content */}
        <div className="p-8 pt-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="bg-[#f6f7f9] dark:bg-slate-800/50 rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
                Group Name
              </label>
              <Input 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm h-11"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
                Group Picture
              </label>
              <div className="flex items-center gap-4 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 bg-white dark:bg-slate-800 shadow-sm">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 h-9 font-medium px-6"
                >
                  Choose File
                </Button>
                <span className="text-sm text-slate-400">
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white dark:bg-slate-900 flex items-center gap-3">
          <Button 
            onClick={handleSave}
            disabled={!groupName.trim()}
            className="bg-[#00d0d4] hover:bg-[#00b0b4] text-white px-8 h-11 font-bold rounded-lg flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Save Changes
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="px-8 h-11 font-bold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg bg-[#f6f7f9] dark:bg-slate-800/50"
          >
            Cancel
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
}
