"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, CheckCircle2, Trash2, CheckSquare, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ActionModal } from "@/components/molecules/ActionModal";
import { useEmployees } from "@/modules/employees/hooks/useEmployees";
import {
  useMeetingDecisions,
  useCreateDecision,
  useApproveDecision,
  useDeleteDecision,
} from "../../hooks/useMeetings";
import ConvertToTaskModal from "./ConvertToTaskModal";
import type { MeetingDecision } from "../../types/meetings.types";
import toast from "react-hot-toast";

interface MeetingDecisionsProps {
  meetingId: number | string;
  isHost?: boolean;
}

export default function MeetingDecisions({ meetingId, isHost = false }: MeetingDecisionsProps) {
  const t = useTranslations("meetings");
  const { data: employeesData } = useEmployees({ per_page: 100 });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");

  // Convert to task modal state
  const [convertingDecision, setConvertingDecision] = useState<MeetingDecision | null>(null);

  const { data: decisions = [], isLoading } = useMeetingDecisions(meetingId);
  const { mutate: createDecision, isPending: isCreating } = useCreateDecision();
  const { mutate: approveDecision, isPending: isApproving } = useApproveDecision();
  const { mutate: deleteDecision, isPending: isDeleting } = useDeleteDecision();

  const handleCreateSubmit = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.error(t("validation.decisionTitleRequired"));
      return;
    }

    createDecision(
      {
        meetingId,
        payload: {
          title: cleanTitle,
          description: description ? description.trim() : null,
          assigned_to: assignedTo ? Number(assignedTo) : null,
        },
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setTitle("");
          setDescription("");
          setAssignedTo("");
        },
      }
    );
  };

  const employees = employeesData?.data || [];

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b bg-muted/20 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>{t("roomTabs.decisions")}</span>
        </h3>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="h-8 gap-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t("decisions.createDecision")}</span>
        </Button>
      </div>

      {/* Decisions List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {decisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
            <ShieldCheck className="w-10 h-10 stroke-1 mb-2 opacity-60" />
            <p className="text-sm font-medium">لا توجد قرارات مسجلة حتى الآن</p>
            <p className="text-xs mt-1">وثق القرارات المتفق عليها أثناء الاجتماع واعتمدها رسمياً.</p>
          </div>
        ) : (
          decisions.map((dec) => (
            <div
              key={dec.id}
              className="p-4 bg-muted/30 border rounded-xl space-y-3 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-foreground">{dec.title}</h4>
                    {dec.status === "approved" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] gap-1 py-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t("decisions.approved")}</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 py-0">
                        {t("decisions.pending")}
                      </Badge>
                    )}
                  </div>

                  {dec.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {dec.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {dec.status !== "approved" && (
                    <Button
                      size="sm"
                      onClick={() => approveDecision({ decisionId: dec.id, meetingId })}
                      disabled={isApproving}
                      className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t("decisions.approve")}</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteDecision({ decisionId: dec.id, meetingId })}
                    disabled={isDeleting}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 border-t flex items-center justify-between text-xs">
                {dec.assignee ? (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>المسؤول: {dec.assignee.name}</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">-</span>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConvertingDecision(dec)}
                  className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{t("decisions.convertToTask")}</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Decision Modal */}
      <ActionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t("decisions.createDecision")}
        mode="add"
        saveLabel={t("common.save")}
        onSubmit={handleCreateSubmit}
        isLoading={isCreating}
        size="md"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{t("decisions.title")}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("decisions.titlePlaceholder")}
              className="text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{t("decisions.description")}</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب أسباب وتفاصيل القرار..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{t("decisions.assignedTo")}</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:ring-1 focus:ring-primary"
            >
              <option value="">غير محدد</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || emp.user?.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ActionModal>

      {/* Convert Decision to Task Modal */}
      {convertingDecision && (
        <ConvertToTaskModal
          isOpen={Boolean(convertingDecision)}
          onClose={() => setConvertingDecision(null)}
          meetingId={meetingId}
          sourceType="decision"
          sourceId={convertingDecision.id}
          defaultTitle={convertingDecision.title}
          defaultDescription={convertingDecision.description || ""}
          defaultAssigneeId={convertingDecision.assigned_to}
        />
      )}
    </div>
  );
}
