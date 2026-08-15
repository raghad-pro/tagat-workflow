"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField, TextAreaField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { useProjects } from "@/modules/projects/hooks/useProjects";
import { useEmployees } from "@/modules/employees/hooks/useEmployees";
import {
  useConvertDecisionToTask,
  useConvertActionItemToTask,
  useConvertMessageToTask,
} from "../../hooks/useMeetings";
import type { ConvertToTaskPayload } from "../../types/meetings.types";

interface ConvertToTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: number | string;
  sourceType: "decision" | "action_item" | "message";
  sourceId: number | string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultAssigneeId?: number | null;
  defaultPriority?: "low" | "medium" | "high" | "urgent";
}

const convertSchema = z.object({
  title: z.string().min(2, "عنوان المهمة مطلوب"),
  description: z.string().optional(),
  project_id: z.string().min(1, "يجب اختيار المشروع"),
  assigned_to: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

type FormValues = z.infer<typeof convertSchema>;

export default function ConvertToTaskModal({
  isOpen,
  onClose,
  meetingId,
  sourceType,
  sourceId,
  defaultTitle = "",
  defaultDescription = "",
  defaultAssigneeId,
  defaultPriority = "medium",
}: ConvertToTaskModalProps) {
  const t = useTranslations("meetings");
  const { data: projectsData } = useProjects({ per_page: 100 });
  const { data: employeesData } = useEmployees({ per_page: 100 });

  const { mutate: convertDecision, isPending: isConvertingDecision } = useConvertDecisionToTask();
  const { mutate: convertActionItem, isPending: isConvertingActionItem } = useConvertActionItemToTask();
  const { mutate: convertMessage, isPending: isConvertingMessage } = useConvertMessageToTask();

  const isPending = isConvertingDecision || isConvertingActionItem || isConvertingMessage;

  const form = useForm<any>({
    resolver: zodResolver(convertSchema),
    defaultValues: {
      title: defaultTitle,
      description: defaultDescription,
      project_id: "",
      assigned_to: defaultAssigneeId ? String(defaultAssigneeId) : "",
      priority: defaultPriority,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: defaultTitle,
        description: defaultDescription,
        project_id: "",
        assigned_to: defaultAssigneeId ? String(defaultAssigneeId) : "",
        priority: defaultPriority,
      });
    }
  }, [isOpen, defaultTitle, defaultDescription, defaultAssigneeId, defaultPriority, form]);

  const projectOptions = (projectsData?.data || []).map((p: any) => ({
    value: String(p.id),
    label: p.title || p.name || `Project #${p.id}`,
  }));

  const employeeOptions = (employeesData?.data || []).map((e: any) => ({
    value: String(e.id || e.user_id),
    label: e.name || e.user?.name || `Employee #${e.id}`,
  }));

  const priorityOptions = [
    { value: "low", label: "منخفضة (Low)" },
    { value: "medium", label: "متوسطة (Medium)" },
    { value: "high", label: "عالية (High)" },
    { value: "urgent", label: "طارئة (Urgent)" },
  ];

  const onSubmit = (values: FormValues) => {
    const payload: ConvertToTaskPayload = {
      project_id: Number(values.project_id),
      assigned_to: values.assigned_to ? Number(values.assigned_to) : undefined,
      priority: values.priority,
      title: values.title.trim(),
      description: values.description ? values.description.trim() : undefined,
    };

    const handleSuccess = () => {
      form.reset();
      onClose();
    };

    if (sourceType === "decision") {
      convertDecision({ decisionId: sourceId, payload, meetingId }, { onSuccess: handleSuccess });
    } else if (sourceType === "action_item") {
      convertActionItem({ actionItemId: sourceId, payload, meetingId }, { onSuccess: handleSuccess });
    } else if (sourceType === "message") {
      convertMessage({ messageId: sourceId, payload, meetingId }, { onSuccess: handleSuccess });
    }
  };

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("conversion.modalTitle")}
      mode="add"
      saveLabel={t("conversion.convertBtn")}
      onSubmit={form.handleSubmit(onSubmit)}
      isLoading={isPending}
      size="md"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            control={form.control}
            name="title"
            label="عنوان المهمة"
            placeholder="أدخل عنوان المهمة..."
            required
          />

          <TextAreaField
            control={form.control}
            name="description"
            label="تفاصيل المهمة"
            placeholder="اكتب تفاصيل المهمة..."
          />

          <SelectField
            control={form.control}
            name="project_id"
            label={t("conversion.selectProject")}
            options={projectOptions}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              control={form.control}
              name="assigned_to"
              label={t("conversion.selectAssignee")}
              options={[{ value: "", label: "غير محدد" }, ...employeeOptions]}
            />

            <SelectField
              control={form.control}
              name="priority"
              label={t("conversion.selectPriority")}
              options={priorityOptions}
            />
          </div>
        </form>
      </Form>
    </ActionModal>
  );
}
