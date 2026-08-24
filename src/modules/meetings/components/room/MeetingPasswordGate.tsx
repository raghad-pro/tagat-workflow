"use client";

import React, { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";

interface MeetingPasswordGateProps {
  title?: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

/**
 * The only thing that still stands between the user and the room.
 *
 * Device setup moved inside the meeting, but a private meeting's password
 * cannot: `media/join` needs it to mint a token, so it has to be collected
 * before the room is allowed to connect.
 */
export default function MeetingPasswordGate({
  title,
  onSubmit,
  onCancel,
}: MeetingPasswordGateProps) {
  const [password, setPassword] = useState("");
  const canSubmit = password.trim().length > 0;

  const submit = () => {
    if (canSubmit) onSubmit(password.trim());
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] bg-[#0D1117] rounded-[16px] border border-[#1A2236] text-white p-4 sm:p-6 flex flex-col">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#161B22] transition-colors cursor-pointer rtl:rotate-180"
          title="Back to meeting"
        >
          <ArrowLeft size={17} />
        </button>
        <h1 className="text-[16px] font-bold truncate">{title || "Meeting"}</h1>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[380px] rounded-[16px] border border-[#1E293B] bg-[#111827] p-6 flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-[#25C6DA]/15 border border-[#25C6DA]/40 flex items-center justify-center">
              <Lock size={20} className="text-[#25C6DA]" />
            </div>
            <h2 className="text-[15px] font-bold">This meeting is private</h2>
            <p className="text-[12px] text-[#94A3B8]">
              Enter the meeting password to join.
            </p>
          </div>

          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Meeting password"
            className="h-10 rounded-lg bg-[#0D1117] border border-[#1E293B] px-3 text-[13px] focus:outline-none focus:border-[#25C6DA]"
          />

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={submit}
              className="h-11 rounded-[12px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white font-bold text-[14px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join meeting
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="h-10 rounded-[12px] bg-transparent text-[#94A3B8] hover:text-white text-[13px] font-semibold transition-colors cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
