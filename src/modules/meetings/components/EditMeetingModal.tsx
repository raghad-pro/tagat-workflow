"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField, TextAreaField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { useUpdateMeeting } from "../hooks/useMeetings";
import { useProjects } from "@/modules/projects/hooks/useProjects";
import type { Meeting, UpdateMeetingPayload } from "../types/meetings.types";

interface EditMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
}

const editMeetingSchema = z.object({
  title: z.string().min(2, "العنوان مطلوب ويجب أن يتكون من حرفين على الأقل"),
  description: z.string().optional(),
  scheduled_at: z.string().optional(),
  max_participants: z.coerce.number().min(2).max(100).default(25),
  project_id: z.string().optional(),
  allow_chat: z.boolean().default(true),
  allow_recording: z.boolean().default(false),
  allow_screen_share: z.boolean().default(true),
  allow_whiteboard: z.boolean().default(true),
  allow_file_share: z.boolean().default(true),
});

type FormValues = z.infer<typeof editMeetingSchema>;

export default function EditMeetingModal({ isOpen, onClose, meeting }: EditMeetingModalProps) {
  const t = useTranslations("meetings");
  const { mutate: updateMeeting, isPending } = useUpdateMeeting();
  const { data: projectsData } = useProjects({ per_page: 100 });

  const form = useForm<any>({
    resolver: zodResolver(editMeetingSchema),
    defaultValues: {
      title: "",
      description: "",
      scheduled_at: "",
      max_participants: 25,
      project_id: "",
      allow_chat: true,
      allow_recording: false,
      allow_screen_share: true,
      allow_whiteboard: true,
      allow_file_share: true,
    },
  });

  useEffect(() => {
    if (meeting) {
      let formattedDate = "";
      if (meeting.scheduled_at) {
        try {
          formattedDate = new Date(meeting.scheduled_at).toISOString().slice(0, 16);
        } catch {
          formattedDate = meeting.scheduled_at.slice(0, 16);
        }
      }

      form.reset({
        title: meeting.title || "",
        description: meeting.description || "",
        scheduled_at: formattedDate,
        max_participants: meeting.max_participants || 25,
        project_id: meeting.project_id ? String(meeting.project_id) : "",
        allow_chat: meeting.allow_chat ?? true,
        allow_recording: meeting.allow_recording ?? false,
        allow_screen_share: meeting.allow_screen_share ?? true,
        allow_whiteboard: meeting.allow_whiteboard ?? true,
        allow_file_share: meeting.allow_file_share ?? true,
      });
    }
  }, [meeting, form]);

  const projectOptions = (projectsData?.data || []).map((p: any) => ({
    value: String(p.id),
    label: p.title || p.name || `Project #${p.id}`,
  }));

  const onSubmit = (values: FormValues) => {
    if (!meeting) return;

    const payload: UpdateMeetingPayload = {
      title: values.title.trim(),
      description: values.description ? values.description.trim() : null,
      scheduled_at: values.scheduled_at ? values.scheduled_at.replace("T", " ") + ":00" : null,
      max_participants: Number(values.max_participants) || 25,
      project_id: values.project_id && values.project_id !== "none" ? Number(values.project_id) : null,
      allow_chat: Boolean(values.allow_chat),
      allow_recording: Boolean(values.allow_recording),
      allow_screen_share: Boolean(values.allow_screen_share),
      allow_whiteboard: Boolean(values.allow_whiteboard),
      allow_file_share: Boolean(values.allow_file_share),
    };

    updateMeeting(
      { id: meeting.id, payload },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("editMeeting")}
      mode="edit"
      saveLabel={t("form.updateBtn")}
      onSubmit={form.handleSubmit(onSubmit)}
      isLoading={isPending}
      size="lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            control={form.control}
            name="title"
            label={t("form.title")}
            placeholder={t("form.titlePlaceholder")}
            required
          />

          <TextAreaField
            control={form.control}
            name="description"
            label={t("form.description")}
            placeholder={t("form.descriptionPlaceholder")}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="scheduled_at"
              label={t("form.scheduledAt")}
              type="text"
              placeholder="YYYY-MM-DD HH:MM"
            />

            <SelectField
              control={form.control}
              name="project_id"
              label={t("form.project")}
              options={[{ value: "none", label: "بدون مشروع" }, ...projectOptions]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="max_participants"
              label={t("form.maxParticipants")}
              type="number"
            />
          </div>

          {/* Permissions switches */}
          <div className="p-3 bg-muted/20 rounded-lg border space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("form.permissions")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.watch("allow_chat")}
                  onChange={(e) => form.setValue("allow_chat", e.target.checked)}
                  className="rounded text-primary cursor-pointer"
                />
                <span>{t("form.allowChat")}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.watch("allow_screen_share")}
                  onChange={(e) => form.setValue("allow_screen_share", e.target.checked)}
                  className="rounded text-primary cursor-pointer"
                />
                <span>{t("form.allowScreenShare")}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.watch("allow_whiteboard")}
                  onChange={(e) => form.setValue("allow_whiteboard", e.target.checked)}
                  className="rounded text-primary cursor-pointer"
                />
                <span>{t("form.allowWhiteboard")}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.watch("allow_recording")}
                  onChange={(e) => form.setValue("allow_recording", e.target.checked)}
                  className="rounded text-primary cursor-pointer"
                />
                <span>{t("form.allowRecording")}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.watch("allow_file_share")}
                  onChange={(e) => form.setValue("allow_file_share", e.target.checked)}
                  className="rounded text-primary cursor-pointer"
                />
                <span>{t("form.allowFileShare")}</span>
              </label>
            </div>
          </div>
        </form>
      </Form>
    </ActionModal>
  );
}
