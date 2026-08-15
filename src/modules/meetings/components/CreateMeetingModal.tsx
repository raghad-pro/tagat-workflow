"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField, TextAreaField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { useCreateMeeting } from "../hooks/useMeetings";
import { useProjects } from "@/modules/projects/hooks/useProjects";
import type { CreateMeetingPayload, MeetingType } from "../types/meetings.types";

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createMeetingSchema = z.object({
  title: z.string().min(2, "العنوان مطلوب ويجب أن يتكون من حرفين على الأقل"),
  description: z.string().optional(),
  type: z.enum(["instant", "scheduled", "recurring"]).default("scheduled"),
  scheduled_at: z.string().optional(),
  max_participants: z.coerce.number().min(2).max(100).default(25),
  project_id: z.string().optional(),
  is_private: z.boolean().default(false),
  password: z.string().optional(),
  allow_chat: z.boolean().default(true),
  allow_recording: z.boolean().default(false),
  allow_screen_share: z.boolean().default(true),
  allow_whiteboard: z.boolean().default(true),
  allow_file_share: z.boolean().default(true),
});

type FormValues = z.infer<typeof createMeetingSchema>;

export default function CreateMeetingModal({ isOpen, onClose }: CreateMeetingModalProps) {
  const t = useTranslations("meetings");
  const { mutate: createMeeting, isPending } = useCreateMeeting();
  const { data: projectsData } = useProjects({ per_page: 100 });

  const form = useForm<any>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "scheduled",
      scheduled_at: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      max_participants: 25,
      project_id: "",
      is_private: false,
      password: "",
      allow_chat: true,
      allow_recording: false,
      allow_screen_share: true,
      allow_whiteboard: true,
      allow_file_share: true,
    },
  });

  const selectedType = form.watch("type");
  const isPrivate = form.watch("is_private");

  const projectOptions = (projectsData?.data || []).map((p: any) => ({
    value: String(p.id),
    label: p.title || p.name || `Project #${p.id}`,
  }));

  const typeOptions = [
    { value: "scheduled", label: t("type.scheduled") },
    { value: "instant", label: t("type.instant") },
    { value: "recurring", label: t("type.recurring") },
  ];

  const onSubmit = (values: FormValues) => {
    const payload: CreateMeetingPayload = {
      title: values.title.trim(),
      description: values.description ? values.description.trim() : null,
      type: values.type as MeetingType,
      scheduled_at: values.type !== "instant" && values.scheduled_at ? values.scheduled_at.replace("T", " ") + ":00" : null,
      max_participants: Number(values.max_participants) || 25,
      project_id: values.project_id && values.project_id !== "none" ? Number(values.project_id) : null,
      is_private: Boolean(values.is_private),
      password: values.is_private && values.password ? values.password : null,
      allow_chat: Boolean(values.allow_chat),
      allow_recording: Boolean(values.allow_recording),
      allow_screen_share: Boolean(values.allow_screen_share),
      allow_whiteboard: Boolean(values.allow_whiteboard),
      allow_file_share: Boolean(values.allow_file_share),
    };

    createMeeting(payload, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  };

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={() => {
        form.reset();
        onClose();
      }}
      title={t("createMeeting")}
      mode="add"
      saveLabel={t("form.createBtn")}
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
            <SelectField
              control={form.control}
              name="type"
              label={t("form.type")}
              options={typeOptions}
              required
            />

            {selectedType !== "instant" && (
              <TextField
                control={form.control}
                name="scheduled_at"
                label={t("form.scheduledAt")}
                type="text"
                placeholder="YYYY-MM-DD HH:MM"
                required
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              control={form.control}
              name="project_id"
              label={t("form.project")}
              options={[{ value: "none", label: "بدون مشروع" }, ...projectOptions]}
            />

            <TextField
              control={form.control}
              name="max_participants"
              label={t("form.maxParticipants")}
              type="number"
            />
          </div>

          {/* Privacy & Password */}
          <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="is_private" className="text-sm font-medium cursor-pointer">
                {t("form.isPrivate")}
              </label>
              <input
                id="is_private"
                type="checkbox"
                checked={form.watch("is_private")}
                onChange={(e) => form.setValue("is_private", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {isPrivate && (
              <TextField
                control={form.control}
                name="password"
                label={t("form.password")}
                placeholder={t("form.passwordPlaceholder")}
                type="password"
                required
              />
            )}
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
