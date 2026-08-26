"use client";

import React, { useState } from "react";
import {
  BarChart2,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import {
  useMeetingPolls,
  useCreatePoll,
  useVotePoll,
  useClosePoll,
} from "../../hooks/useMeetings";
import type { MeetingPoll, CreatePollPayload, VotePollPayload } from "../../types/meetings.types";
import { cn } from "@/lib/utils";

interface MeetingPollsProps {
  meetingId: number | string;
  isHost: boolean;
}

export default function MeetingPolls({ meetingId, isHost }: MeetingPollsProps) {
  const { user } = useAuth();
  const t = useTranslations("meetings.polls");
  const tc = useTranslations("common");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "closed">("all");

  // Form state
  const [question, setQuestion] = useState("");
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [options, setOptions] = useState<string[]>(["", ""]);

  const { data: polls = [], isLoading } = useMeetingPolls(meetingId);
  const { mutate: createPoll, isPending: isCreating } = useCreatePoll();
  const { mutate: votePoll } = useVotePoll();
  const { mutate: closePoll } = useClosePoll();

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setQuestion("");
    setOptions(["", ""]);
  };

  const handleCreate = () => {
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) return;

    const payload: CreatePollPayload = {
      question: question.trim(),
      multiple_choice: multipleChoice,
      options: validOptions.map((title) => ({ title })),
    };

    createPoll(
      { meetingId, payload },
      { onSuccess: handleCancel }
    );
  };

  const validOptionCount = options.filter((o) => o.trim()).length;

  const filteredPolls = polls.filter((p) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "closed") return p.is_closed;
    return !p.is_closed;
  });

  return (
    <div className="flex flex-col h-full rounded-[14px] bg-[#111827] border border-[#1F2937] overflow-hidden text-white">
      {/* ── Top Header matching Figma (polls) ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] bg-[#111827]">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#25C6DA]" />
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#64748B]">
            {t("title")} ({polls.length})
          </span>
        </div>

        {/* Top Controls matching Figma */}
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="h-[33px] px-2.5 rounded-[10px] bg-[#1A2236] text-[#CBD5E1] text-[12px] border border-[#2A3756] focus:outline-none focus:border-[#25C6DA]"
          >
            <option value="all">{t("allStatuses")}</option>
            <option value="active">{t("active")}</option>
            <option value="closed">{t("closed")}</option>
          </select>

          {isHost && !isFormOpen && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1 px-3 h-[33px] rounded-[10px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white text-[12px] font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("newPoll")}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Polls Container ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* In-line Create Poll Form matching Figma */}
        {isFormOpen && (
          <div className="p-4 rounded-[14px] bg-[#1A2236] border border-[#2A3756] space-y-3 animate-in fade-in-50">
            {/* Question */}
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#94A3B8]">{t("question")}</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("questionPlaceholder")}
                className="w-full h-[37px] px-3 rounded-[10px] bg-[#111827] border border-[#2A3756] text-white text-[14px] placeholder:text-[#475569] focus:outline-none focus:border-[#25C6DA]"
                autoFocus
              />
            </div>

            {/* Type */}
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#94A3B8]">{t("type")}</label>
              <select
                value={multipleChoice ? "multiple_choice" : "single_choice"}
                onChange={(e) => setMultipleChoice(e.target.value === "multiple_choice")}
                className="w-full h-[37px] px-3 rounded-[10px] bg-[#111827] border border-[#2A3756] text-[#CBD5E1] text-[14px] focus:outline-none focus:border-[#25C6DA]"
              >
                <option value="single_choice">{t("singleChoice")}</option>
                <option value="multiple_choice">{t("multipleChoice")}</option>
              </select>
            </div>

            {/* Options list */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-[#94A3B8]">{t("options")}</label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={t("optionN", { n: idx + 1 })}
                    className="flex-1 h-[37px] px-3 rounded-[10px] bg-[#111827] border border-[#2A3756] text-[#CBD5E1] text-[14px] focus:outline-none focus:border-[#25C6DA]"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-[#64748B] hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#25C6DA] hover:underline pt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("addOption")}</span>
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating || !question.trim() || validOptionCount < 2}
                className="px-4 py-1.5 h-[28px] rounded-[10px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white text-[12px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isCreating ? tc("creating") : t("createBtn")}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 h-[28px] text-[12px] font-medium text-[#64748B] hover:text-white transition-colors cursor-pointer"
              >
                {tc("cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Existing Polls List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
          </div>
        ) : filteredPolls.length === 0 && !isFormOpen ? (
          <div className="text-center py-10 text-xs text-[#64748B]">
            {t("empty")}
          </div>
        ) : (
          filteredPolls.map((poll) => {
            const totalVotes = poll.total_votes || poll.options.reduce((acc, o) => acc + (o.votes_count || 0), 0);
            const isClosed = Boolean(poll.is_closed);

            return (
              <div
                key={poll.id}
                className="p-3.5 rounded-[12px] bg-[#1A2236] border border-[#2A3756] space-y-3 hover:border-[#25C6DA]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-[14px] font-bold text-white leading-tight">
                    {poll.question}
                  </h4>

                  <div className="flex items-center gap-1">
                    {isHost && !isClosed && (
                      <button
                        onClick={() => closePoll({ pollId: poll.id, meetingId })}
                        className="p-1 text-[#94A3B8] hover:text-amber-400"
                        title={t("closePollTitle")}
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Poll options list */}
                <div className="space-y-2 pt-1">
                  {poll.options.map((opt) => {
                    const percentage = totalVotes > 0 ? Math.round(((opt.votes_count || 0) / totalVotes) * 100) : 0;
                    const hasVotedThis = Boolean(opt.is_voted);

                    return (
                      <button
                        key={opt.id || opt.title}
                        type="button"
                        disabled={isClosed}
                        onClick={() => {
                          if (opt.id) {
                            votePoll({
                              pollId: poll.id,
                              payload: { option_ids: [opt.id] },
                              meetingId,
                            });
                          }
                        }}
                        className={cn(
                          "w-full text-start p-2.5 rounded-[10px] relative overflow-hidden transition-all border",
                          hasVotedThis
                            ? "border-[#25C6DA] bg-[#25C6DA]/15"
                            : "border-[#2A3756] bg-[#111827] hover:border-[#25C6DA]/50"
                        )}
                      >
                        {/* Fill percentage bar */}
                        <div
                          className="absolute top-0 start-0 bottom-0 bg-[#25C6DA]/20 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />

                        <div className="relative flex items-center justify-between z-10 text-[13px]">
                          <span className="font-medium text-white">{opt.title}</span>
                          <span className="font-mono text-[11px] text-[#94A3B8]">
                            {opt.votes_count || 0} ({percentage}%)
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
                  <span>{t("totalVotes")}: {totalVotes}</span>
                  <span className={isClosed ? "text-red-400" : "text-emerald-400"}>
                    {isClosed ? t("closed") : t("active")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
