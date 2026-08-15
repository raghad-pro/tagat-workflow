"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, CheckCircle2, Circle, Trash2, CheckSquare, Calendar, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ActionModal } from "@/components/molecules/ActionModal";
import { useEmployees } from "@/modules/employees/hooks/useEmployees";
import {
  useMeetingActionItems,
  useCreateActionItem,
  useCompleteActionItem,
  useDeleteActionItem,
} from "../../hooks/useMeetings";
import ConvertToTaskModal from "./ConvertToTaskModal";
import type { MeetingActionItem, ActionItemPriority } from "../../types/meetings.types";
import toast from "react-hot-toast";

interface MeetingActionItemsProps {
  meetingId: number | string;
}

export default function MeetingActionItems({ meetingId }: MeetingActionItemsProps) {
  const t = useTranslations("meetings");
  const { data: employeesData } = useEmployees({ per_page: 100 });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [priority, setPriority] = useState<ActionItemPriority>("medium");
  const [dueDate, setDueDate] = useState<string>("");

  // Convert to task modal state
  const [convertingItem, setConvertingItem] = useState<MeetingActionItem | null>(null);

  const { data: actionItems = [], isLoading } = useMeetingActionItems(meetingId);
  const { mutate: createActionItem, isPending: isCreating } = useCreateActionItem();
  const { mutate: completeActionItem, isPending: isCompleting } = useCompleteActionItem();
  const { mutate: deleteActionItem, isPending: isDeleting } = useDeleteActionItem();

  const handleCreateSubmit = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.error("يرجى إدخال عنوان بند العمل");
      return;
    }

    createActionItem(
      {
        meetingId,
        payload: {
          title: cleanTitle,
          description: description ? description.trim() : null,
          assigned_to: assignedTo ? Number(assignedTo) : null,
          priority,
          due_date: dueDate || null,
        },
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setTitle("");
          setDescription("");
          setAssignedTo("");
          setPriority("medium");
          setDueDate("");
        },
      }
    );
  };

  const getPriorityBadge = (p: ActionItemPriority) => {
    switch (p) {
      case "urgent":
        return <Badge variant="destructive" className="text-[10px] py-0">طارئة</Badge>;
      case "high":
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] py-0">عالية</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-[10px] py-0">متوسطة</Badge>;
      case "low":
        return <Badge variant="outline" className="text-[10px] py-0">منخفضة</Badge>;
    }
  };

  const employees = employeesData?.data || [];

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b bg-muted/20 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span>{t("roomTabs.actionItems")}</span>
        </h3>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="h-8 gap-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t("actionItems.createActionItem")}</span>
        </Button>
      </div>

      {/* Action Items List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {actionItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
            <CheckSquare className="w-10 h-10 stroke-1 mb-2 opacity-60" />
            <p className="text-sm font-medium">لا توجد بنود عمل مسجلة حتى الآن</p>
            <p className="text-xs mt-1">سجل التوصيات والمهام ووزعها على الحضور مع تحديد مواعيد التسليم.</p>
          </div>
        ) : (
          actionItems.map((item) => {
            const isDone = item.status === "completed";

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all space-y-2.5 group ${
                  isDone ? "bg-muted/20 border-border/60 opacity-80" : "bg-muted/30 border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => !isDone && completeActionItem({ actionItemId: item.id, meetingId })}
                      className="mt-0.5 text-muted-foreground hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                      title={isDone ? "مكتمل" : "تعليم كمكتمل"}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {item.title}
                        </span>
                        {getPriorityBadge(item.priority || "medium")}
                      </div>

                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteActionItem({ actionItemId: item.id, meetingId })}
                    disabled={isDeleting}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Metadata & Actions */}
                <div className="pt-2 border-t flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {item.assignee && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{item.assignee.name}</span>
                      </span>
                    )}

                    {item.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{item.due_date}</span>
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConvertingItem(item)}
                    className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{t("actionItems.convertToTask")}</span>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Action Item Modal */}
      <ActionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t("actionItems.createActionItem")}
        mode="add"
        saveLabel={t("common.save")}
        onSubmit={handleCreateSubmit}
        isLoading={isCreating}
        size="md"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{t("actionItems.title")}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("actionItems.titlePlaceholder")}
              className="text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">تفاصيل بند العمل</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب التوجيهات أو الملاحظات الخاصة بالبند..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{t("actionItems.assignedTo")}</label>
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{t("actionItems.priority")}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActionItemPriority)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:ring-1 focus:ring-primary"
              >
                <option value="low">منخفضة (Low)</option>
                <option value="medium">متوسطة (Medium)</option>
                <option value="high">عالية (High)</option>
                <option value="urgent">طارئة (Urgent)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{t("actionItems.dueDate")}</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </ActionModal>

      {/* Convert Action Item to Task Modal */}
      {convertingItem && (
        <ConvertToTaskModal
          isOpen={Boolean(convertingItem)}
          onClose={() => setConvertingItem(null)}
          meetingId={meetingId}
          sourceType="action_item"
          sourceId={convertingItem.id}
          defaultTitle={convertingItem.title}
          defaultDescription={convertingItem.description || ""}
          defaultAssigneeId={convertingItem.assigned_to}
          defaultPriority={convertingItem.priority}
        />
      )}
    </div>
  );
}
