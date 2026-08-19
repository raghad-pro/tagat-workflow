"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, ChevronDown, Clock, Info, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useUpdateMeeting } from "../hooks/useMeetings";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import type { Meeting, UpdateMeetingPayload } from "../types/meetings.types";
import { cn } from "@/lib/utils";

interface EditMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
}

const editMeetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company_id: z.string().optional(),
  amount: z.string().optional(),
  scheduled_at: z.string().optional(),
  max_participants: z.string().default("100"),
  notes: z.string().optional(),
  is_private: z.boolean().default(false),
  password: z.string().optional(),
  allow_chat: z.boolean().default(true),
  allow_screen_share: z.boolean().default(true),
  allow_whiteboard: z.boolean().default(true),
  allow_file_share: z.boolean().default(true),
  allow_recording: z.boolean().default(false),
});

type FormValues = z.infer<typeof editMeetingSchema>;

export default function EditMeetingModal({ isOpen, onClose, meeting }: EditMeetingModalProps) {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const { mutate: updateMeeting, isPending } = useUpdateMeeting();
  const { data: companiesData } = useCompanies({ per_page: 100 });

  const form = useForm<FormValues>({
    resolver: zodResolver(editMeetingSchema) as any,
    defaultValues: {
      title: "",
      company_id: "",
      amount: "0",
      scheduled_at: "",
      max_participants: "100",
      notes: "",
      is_private: false,
      password: "",
      allow_chat: true,
      allow_screen_share: true,
      allow_whiteboard: true,
      allow_file_share: true,
      allow_recording: false,
    },
  });

  useEffect(() => setMounted(true), []);

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
        company_id: meeting.company_id ? String(meeting.company_id) : "",
        amount: String((meeting as any).amount || "0"),
        scheduled_at: formattedDate,
        max_participants: String(meeting.max_participants || 100),
        notes: meeting.description || "",
        is_private: Boolean(meeting.is_private),
        password: meeting.password || "",
        allow_chat: meeting.allow_chat ?? true,
        allow_screen_share: meeting.allow_screen_share ?? true,
        allow_whiteboard: meeting.allow_whiteboard ?? true,
        allow_file_share: meeting.allow_file_share ?? true,
        allow_recording: meeting.allow_recording ?? false,
      });
    }
  }, [meeting, form]);

  if (!mounted || !isOpen || !meeting) return null;

  const companiesList = companiesData?.data?.data || [];

  const onSubmit = (values: FormValues) => {
    const payload: UpdateMeetingPayload = {
      title: values.title.trim(),
      description: values.notes ? values.notes.trim() : null,
      scheduled_at: values.scheduled_at
        ? values.scheduled_at.replace("T", " ") + ":00"
        : null,
      max_participants: Number(values.max_participants) || 100,
      company_id: values.company_id ? Number(values.company_id) : undefined,
      amount: values.amount ? Number(values.amount) : undefined,
      is_private: Boolean(values.is_private),
      password: values.is_private && values.password ? values.password : null,
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
          form.reset();
          onClose();
        },
      }
    );
  };

  const CustomCheckbox = ({
    name,
    label,
  }: {
    name: keyof FormValues;
    label: string;
  }) => {
    const isChecked = Boolean(form.watch(name));
    return (
      <label className="flex items-center gap-2 text-[13px] font-medium text-[#2D3748] dark:text-gray-200 cursor-pointer select-none">
        <div
          onClick={(e) => {
            e.preventDefault();
            form.setValue(name, !isChecked as any);
          }}
          className={cn(
            "w-4 h-4 rounded-[4px] flex items-center justify-center transition-all shrink-0",
            isChecked
              ? "bg-[#25C6DA] border border-[#25C6DA] text-white"
              : "bg-white dark:bg-[#2D3748] border border-[#CBD5E0] dark:border-gray-600"
          )}
        >
          {isChecked && <Check size={11} strokeWidth={3.5} className="text-white" />}
        </div>
        <span>{label}</span>
      </label>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isPending) onClose();
        }}
      />

      {/* Modal Box - Compact without scroll */}
      <div className="relative w-full max-w-[880px] bg-white dark:bg-[#1A202C] rounded-[16px] p-5 sm:p-6 shadow-2xl transition-all my-auto border border-[#E2E8F0] dark:border-gray-800">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#EDF2F7] dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#2D3748] dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-[20px] sm:text-[22px] font-bold text-[#1A202C] dark:text-white leading-tight">
              Edit Meeting
            </h2>
            <p className="text-[12px] sm:text-[13px] text-[#718096] dark:text-gray-400 mt-0.5">
              Update details for {meeting.title}
            </p>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="pt-4 flex flex-col gap-3.5">
          {/* Top Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
            {/* Column 1 - Row 1: Company */}
            <div className="flex flex-col gap-1">
              <label className="text-[13.5px] font-bold text-[#1A202C] dark:text-gray-200">
                Company
              </label>
              <div className="relative">
                <select
                  {...form.register("company_id")}
                  className="w-full h-[38px] rounded-[8px] bg-white dark:bg-[#2D3748] border border-[#E2E8F0] dark:border-gray-700 px-3 pe-8 text-[13px] text-[#2D3748] dark:text-white focus:outline-none focus:border-[#25C6DA] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">select</option>
                  {companiesList.map((comp: any) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name || `Company #${comp.id}`}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[#718096]"
                />
              </div>
            </div>

            {/* Column 2 - Row 1: Title */}
            <div className="flex flex-col gap-1">
              <label className="text-[13.5px] font-bold text-[#1A202C] dark:text-gray-200">
                Title
              </label>
              <input
                type="text"
                {...form.register("title")}
                placeholder=""
                className="w-full h-[38px] rounded-[8px] bg-white dark:bg-[#2D3748] border border-[#E2E8F0] dark:border-gray-700 px-3 text-[13px] text-[#2D3748] dark:text-white focus:outline-none focus:border-[#25C6DA] transition-colors"
              />
              {form.formState.errors.title && (
                <span className="text-[11px] text-red-500 font-medium">
                  {form.formState.errors.title.message}
                </span>
              )}
            </div>

            {/* Column 1 - Row 2: Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[13.5px] font-bold text-[#1A202C] dark:text-gray-200">
                Amount
              </label>
              <div className="relative">
                <select
                  {...form.register("amount")}
                  className="w-full h-[38px] rounded-[8px] bg-white dark:bg-[#2D3748] border border-[#E2E8F0] dark:border-gray-700 px-3 pe-8 text-[13px] text-[#2D3748] dark:text-white focus:outline-none focus:border-[#25C6DA] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">select</option>
                  <option value="0">0.00 (Free)</option>
                  <option value="50">50.00 USD</option>
                  <option value="100">100.00 USD</option>
                  <option value="200">200.00 USD</option>
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[#718096]"
                />
              </div>
            </div>

            {/* Column 2 - Row 2: Max Participants */}
            <div className="flex flex-col gap-1">
              <label className="text-[13.5px] font-bold text-[#1A202C] dark:text-gray-200">
                Max Participants
              </label>
              <input
                type="number"
                {...form.register("max_participants")}
                defaultValue="100"
                className="w-full h-[38px] rounded-[8px] bg-white dark:bg-[#2D3748] border border-[#E2E8F0] dark:border-gray-700 px-3 text-[13px] text-[#2D3748] dark:text-white focus:outline-none focus:border-[#25C6DA] transition-colors"
              />
            </div>

            {/* Column 1 - Row 3: Scheduled At (Span 2) */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-[13.5px] font-bold text-[#1A202C] dark:text-gray-200">
                Scheduled At
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  {...form.register("scheduled_at")}
                  className="w-full h-[38px] rounded-[8px] bg-white dark:bg-[#2D3748] border border-[#E2E8F0] dark:border-gray-700 px-3 pe-8 text-[13px] text-[#2D3748] dark:text-white focus:outline-none focus:border-[#25C6DA] transition-colors"
                />
                <Clock
                  size={15}
                  className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[#718096]"
                />
              </div>
            </div>

            {/* Full Width Row 4: Notes */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-[13.5px] font-bold text-[#1A202C] dark:text-gray-200">
                Notes
              </label>
              <textarea
                rows={2}
                {...form.register("notes")}
                placeholder=""
                className="w-full h-[64px] min-h-[64px] rounded-[8px] bg-white dark:bg-[#2D3748] border border-[#E2E8F0] dark:border-gray-700 p-2.5 text-[13px] text-[#2D3748] dark:text-white focus:outline-none focus:border-[#25C6DA] transition-colors resize-none"
              />
            </div>
          </div>

          {/* ── Features & Checkboxes Container ── */}
          <div className="border border-dashed border-[#CBD5E0] dark:border-gray-700 rounded-[10px] p-3.5 flex flex-col gap-2.5">
            {/* Private Meeting pill */}
            <div className="bg-[#F8FAFC] dark:bg-[#2D3748]/60 rounded-[6px] p-2.5 flex flex-col gap-2">
              <CustomCheckbox name="is_private" label="Private meeting" />
              {form.watch("is_private") && (
                <div className="flex flex-col gap-1 ps-6">
                  <label className="text-[12px] font-semibold text-[#1A202C] dark:text-gray-200" htmlFor="edit-meeting-password">
                    Meeting password
                  </label>
                  <input
                    id="edit-meeting-password"
                    type="password"
                    {...form.register("password", {
                      validate: (value) => !form.getValues("is_private") || Boolean(value?.trim()) || "Password is required for private meetings",
                    })}
                    placeholder="Enter a password"
                    className="w-full h-[36px] rounded-[8px] bg-white dark:bg-[#2D3748] border border-[#E2E8F0] dark:border-gray-700 px-3 text-[13px] text-[#2D3748] dark:text-white focus:outline-none focus:border-[#25C6DA] transition-colors"
                  />
                  {form.formState.errors.password && (
                    <span className="text-[11px] text-red-500 font-medium">
                      {String(form.formState.errors.password.message)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Features list */}
            <div>
              <span className="text-[12px] text-[#718096] dark:text-gray-400 font-medium block mb-2">
                Features
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2.5 gap-x-4">
                <CustomCheckbox name="allow_chat" label="Allow chat" />
                <CustomCheckbox name="allow_screen_share" label="Allow screen share" />
                <CustomCheckbox name="allow_whiteboard" label="Allow whiteboard" />
                <CustomCheckbox name="allow_file_share" label="Allow file share" />
                <CustomCheckbox name="allow_recording" label="Allow recording" />
              </div>
            </div>
          </div>

          {/* ── Footer Buttons ── */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="h-[44px] px-8 sm:w-[170px] rounded-[8px] bg-[#25C6DA] hover:bg-[#20b2c4] active:bg-[#1da2b4] text-white font-bold text-[14px] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Update</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="h-[44px] px-8 sm:w-[170px] rounded-[8px] bg-[#F7FAFC] dark:bg-[#2D3748] text-[#1A202C] dark:text-white font-bold text-[14px] hover:bg-[#EDF2F7] dark:hover:bg-gray-700 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
