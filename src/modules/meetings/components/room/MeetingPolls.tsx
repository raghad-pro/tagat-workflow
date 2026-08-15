"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, CheckCircle2, BarChart2, Lock, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActionModal } from "@/components/molecules/ActionModal";
import {
  useMeetingPolls,
  useCreatePoll,
  useVotePoll,
  useClosePoll,
} from "../../hooks/useMeetings";
import type { CreatePollPayload, MeetingPoll } from "../../types/meetings.types";
import toast from "react-hot-toast";

interface MeetingPollsProps {
  meetingId: number | string;
  isHost?: boolean;
}

export default function MeetingPolls({ meetingId, isHost = false }: MeetingPollsProps) {
  const t = useTranslations("meetings");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [allowChangeVote, setAllowChangeVote] = useState(true);

  // Selected option per poll for voting
  const [selectedVotes, setSelectedVotes] = useState<Record<number, number[]>>({});

  const { data: polls = [], isLoading } = useMeetingPolls(meetingId);
  const { mutate: createPoll, isPending: isCreating } = useCreatePoll();
  const { mutate: votePoll, isPending: isVoting } = useVotePoll();
  const { mutate: closePoll, isPending: isClosing } = useClosePoll();

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions((prev) => [...prev, ""]);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleCreateSubmit = () => {
    const cleanQuestion = question.trim();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);

    if (!cleanQuestion) {
      toast.error("يرجى كتابة سؤال الاستطلاع");
      return;
    }
    if (cleanOptions.length < 2) {
      toast.error("يرجى إدخال خيارين على الأقل");
      return;
    }

    const payload: CreatePollPayload = {
      question: cleanQuestion,
      options: cleanOptions.map((title) => ({ title })),
      multiple_choice: multipleChoice,
      anonymous,
      show_results: showResults,
      allow_change_vote: allowChangeVote,
    };

    createPoll(
      { meetingId, payload },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setQuestion("");
          setOptions(["", ""]);
        },
      }
    );
  };

  const handleSelectOption = (poll: MeetingPoll, optId: number) => {
    const current = selectedVotes[poll.id] || [];
    if (poll.multiple_choice) {
      if (current.includes(optId)) {
        setSelectedVotes((prev) => ({
          ...prev,
          [poll.id]: current.filter((id) => id !== optId),
        }));
      } else {
        setSelectedVotes((prev) => ({
          ...prev,
          [poll.id]: [...current, optId],
        }));
      }
    } else {
      setSelectedVotes((prev) => ({
        ...prev,
        [poll.id]: [optId],
      }));
    }
  };

  const handleCastVote = (pollId: number) => {
    const optionIds = selectedVotes[pollId] || [];
    if (optionIds.length === 0) {
      toast.error("يرجى اختيار إجابة للتصويت");
      return;
    }

    votePoll({
      pollId,
      meetingId,
      payload: { option_ids: optionIds },
    });
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b bg-muted/20 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <span>{t("roomTabs.polls")}</span>
        </h3>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="h-8 gap-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t("polls.createPoll")}</span>
        </Button>
      </div>

      {/* Polls List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {polls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
            <BarChart2 className="w-10 h-10 stroke-1 mb-2 opacity-60" />
            <p className="text-sm font-medium">لا توجد استطلاعات رأي حتى الآن</p>
            <p className="text-xs mt-1">أنشئ استطلاعاً للحصول على تصويت فوري من الحضور.</p>
          </div>
        ) : (
          polls.map((poll) => {
            const totalVotes =
              poll.options.reduce((sum, opt) => sum + (opt.votes_count || 0), 0) || poll.total_votes || 0;
            const currentSelected = selectedVotes[poll.id] || [];

            return (
              <div
                key={poll.id}
                className="p-4 bg-muted/30 border rounded-xl space-y-3.5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{poll.question}</h4>
                    {poll.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{poll.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {poll.is_closed ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {t("polls.closed")}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px] border-emerald-500/30">
                        نشط
                      </Badge>
                    )}

                    {isHost && !poll.is_closed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => closePoll({ pollId: poll.id, meetingId })}
                        disabled={isClosing}
                        className="h-7 text-[11px] px-2 text-muted-foreground hover:text-destructive"
                      >
                        {t("polls.closePoll")}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Options & Results */}
                <div className="space-y-2">
                  {poll.options.map((opt, idx) => {
                    const optId = opt.id || idx + 1;
                    const isSelected = currentSelected.includes(optId);
                    const voteCount = opt.votes_count || 0;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                    return (
                      <div
                        key={optId}
                        onClick={() => !poll.is_closed && handleSelectOption(poll, optId)}
                        className={`relative p-3 rounded-lg border text-sm cursor-pointer transition-all overflow-hidden ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-muted-foreground/40 bg-card"
                        } ${poll.is_closed ? "cursor-default" : ""}`}
                      >
                        {/* Percentage bar behind text */}
                        {poll.show_results && totalVotes > 0 && (
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-primary/10 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        )}

                        <div className="relative z-10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/50"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span className="font-medium text-foreground">{opt.title}</span>
                          </div>

                          {poll.show_results && (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {percentage}% ({voteCount})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Vote Action */}
                {!poll.is_closed && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {t("polls.totalVotes", { count: totalVotes })}
                    </span>

                    <Button
                      size="sm"
                      onClick={() => handleCastVote(poll.id)}
                      disabled={isVoting || currentSelected.length === 0}
                      className="h-8 px-4 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {t("polls.vote")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Poll Modal */}
      <ActionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t("polls.createPoll")}
        mode="add"
        saveLabel={t("common.save")}
        onSubmit={handleCreateSubmit}
        isLoading={isCreating}
        size="md"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{t("polls.question")}</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("polls.questionPlaceholder")}
              className="text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">{t("polls.options")}</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  placeholder={t("polls.optionPlaceholder", { index: i + 1 })}
                  className="text-sm"
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(i)}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            {options.length < 8 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full text-xs gap-1 mt-1 border-dashed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("polls.addOption")}</span>
              </Button>
            )}
          </div>

          <div className="p-3 bg-muted/40 rounded-lg space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={multipleChoice}
                onChange={(e) => setMultipleChoice(e.target.checked)}
                className="rounded text-primary"
              />
              <span>{t("polls.multipleChoice")}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="rounded text-primary"
              />
              <span>{t("polls.anonymous")}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showResults}
                onChange={(e) => setShowResults(e.target.checked)}
                className="rounded text-primary"
              />
              <span>{t("polls.showResults")}</span>
            </label>
          </div>
        </div>
      </ActionModal>
    </div>
  );
}
