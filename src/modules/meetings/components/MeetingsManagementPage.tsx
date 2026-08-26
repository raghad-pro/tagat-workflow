"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Video,
  Plus,
  Radio,
  Clock,
  CheckCircle2,
  Search,
  ChevronDown,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Play,
  PhoneOff,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/providers/AuthProvider";
import {
  useMeetings,
  useDeleteMeeting,
  useStartMeeting,
  useEndMeeting,
} from "../hooks/useMeetings";
import { useCompanyNames } from "../hooks/useCompanyNames";
import type { Meeting, MeetingStatus, MeetingType } from "../types/meetings.types";
import CreateMeetingModal from "./CreateMeetingModal";
import EditMeetingModal from "./EditMeetingModal";
import JoinByCodeModal from "./JoinByCodeModal";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export function MeetingsManagementPage() {
  const t = useTranslations("meetings");
  const tc = useTranslations("common");
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || "employee";

  // Filter & Pagination States
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinByCodeOpen, setIsJoinByCodeOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null);

  // Status Filter Open Dropdown State
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  // Query & Mutation
  const { data: meetingsResponse, isLoading } = useMeetings({
    search: search || undefined,
    status: selectedStatus !== "all" ? (selectedStatus as MeetingStatus) : undefined,
    type: selectedType !== "all" ? (selectedType as MeetingType) : undefined,
    page: currentPage,
    per_page: PAGE_SIZE,
  });

  const { mutate: deleteMeeting, isPending: isDeleting } = useDeleteMeeting();
  const { mutate: startMeeting } = useStartMeeting();
  const { mutate: endMeeting } = useEndMeeting();
  const { resolveCompanyName } = useCompanyNames();

  const meetings = useMemo(() => {
    return meetingsResponse?.data || [];
  }, [meetingsResponse]);

  const totalItems = meetingsResponse?.total || meetings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Compute live stats matching Figma design cards
  const stats = useMemo(() => {
    const total = totalItems;
    const inProgress = meetings.filter((m) => m.status === "live").length;
    const scheduled = meetings.filter((m) => m.status === "waiting" || m.type === "scheduled").length;
    const ended = meetings.filter((m) => m.status === "ended" || m.status === "cancelled").length;

    return {
      total,
      live: inProgress,
      scheduled,
      ended,
    };
  }, [meetings, totalItems]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success(t("codeCopied"));
  };

  const handleEnterRoom = (meetingId: number | string) => {
    router.push(`/meetings/${meetingId}`);
  };

  // Status options
  const statusOptions = [
    { label: t("list.allStatuses"), value: "all" },
    { label: t("status.live"), value: "live" },
    { label: t("status.waiting"), value: "waiting" },
    { label: t("status.ended"), value: "ended" },
    { label: t("status.cancelled"), value: "cancelled" },
  ];

  // Type options
  const typeOptions = [
    { label: t("list.allTypes"), value: "all" },
    { label: t("type.scheduled"), value: "scheduled" },
    { label: t("type.instant"), value: "instant" },
  ];

  // Status Badge Formatter matching Figma EXACT styles
  const renderStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case "live":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[12px] bg-[#EDF7EE] text-[#4CAF50] text-[13px] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
            {t("status.live")}
          </span>
        );
      case "waiting":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[12px] bg-[#FFFDEB] text-[#D97706] text-[13px] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#E8D636]" />
            {t("status.waiting")}
          </span>
        );
      case "ended":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[12px] bg-[#FEECEB] text-[#F44336] text-[13px] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#F44336]" />
            {t("list.overdue")}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[12px] bg-[#F3F4F6] text-[#6B7280] text-[13px] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
            {t("status.cancelled")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[12px] bg-muted text-foreground text-[13px] font-medium">
            {status}
          </span>
        );
    }
  };

  // Type Badge Formatter matching Figma EXACT styles
  const renderTypeBadge = (type: MeetingType) => {
    if (type === "scheduled") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E6F6FE] text-[#03A9F4] text-[11px] font-bold">
          {t("type.scheduled")}
        </span>
      );
    }
    if (type === "instant") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FAF5FF] text-[#9810FA] text-[11px] font-bold">
          {t("type.instant")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] text-[11px] font-bold capitalize">
        {type}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ── Background Glow Overlay from Figma ── */}
      <div
        className="pointer-events-none fixed top-0 end-0 w-[820px] h-[688px] rounded-full blur-[96px] -z-10"
        style={{ backgroundColor: "rgba(81, 209, 225, 0.15)" }}
      />

      {/* ── Page Header (Figma Match) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[31px] font-bold tracking-tight text-[#000000] dark:text-white leading-[47px]">
            {t("title")}
          </h1>
          <p className="text-[16px] text-[#424242] dark:text-gray-300 font-normal leading-[24px]">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsJoinByCodeOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 h-[40px] rounded-[8px] border border-[#E2E8F0] ds-bg-form border border-slate-100 dark:border-slate-800 text-[#424242] dark:text-gray-200 text-[15px] font-medium hover:bg-gray-50 dark:hover:bg-muted transition-all cursor-pointer shadow-sm"
          >
            <Video className="w-4 h-4 text-[#25C6DA]" />
            <span>{t("joinByCode")}</span>
          </button>

          {role !== "client" && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center justify-center gap-2 px-8 h-[40px] rounded-[8px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span>{t("list.addMeeting")}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 4 Stats Cards (Figma Exact Match) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="ds-bg-form border border-slate-100 dark:border-slate-800 rounded-[8px] p-6 h-[145px] flex items-center shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] hover:shadow-[0_6px_24px_0_rgba(0,0,0,0.09)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-[48px] h-[48px] rounded-[8px] bg-[#E6F6FE] flex items-center justify-center shrink-0">
              <Video className="w-6 h-6 text-[#03A9F4]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#000000] dark:text-gray-300">
                Total
              </span>
              <span className="text-[30px] font-bold text-[#000000] dark:text-white leading-[36px]">
                {stats.total}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Live */}
        <div className="ds-bg-form border border-slate-100 dark:border-slate-800 rounded-[8px] p-6 h-[145px] flex items-center shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] hover:shadow-[0_6px_24px_0_rgba(0,0,0,0.09)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-[48px] h-[48px] rounded-[8px] bg-[#EDF7EE] flex items-center justify-center shrink-0">
              <Radio className="w-6 h-6 text-[#4CAF50]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#000000] dark:text-gray-300">
                Live
              </span>
              <span className="text-[30px] font-bold text-[#000000] dark:text-white leading-[36px]">
                {stats.live}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Scheduled */}
        <div className="ds-bg-form border border-slate-100 dark:border-slate-800 rounded-[8px] p-6 h-[145px] flex items-center shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] hover:shadow-[0_6px_24px_0_rgba(0,0,0,0.09)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-[48px] h-[48px] rounded-[8px] bg-[#FFFDEB] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-[#E8D636]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#000000] dark:text-gray-300">
                Scheduled
              </span>
              <span className="text-[30px] font-bold text-[#000000] dark:text-white leading-[36px]">
                {stats.scheduled}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Ended */}
        <div className="ds-bg-form border border-slate-100 dark:border-slate-800 rounded-[8px] p-6 h-[145px] flex items-center shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] hover:shadow-[0_6px_24px_0_rgba(0,0,0,0.09)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-[48px] h-[48px] rounded-[8px] bg-[#FEECEB] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-[#F44336]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#000000] dark:text-gray-300">
                Ended
              </span>
              <span className="text-[30px] font-bold text-[#000000] dark:text-white leading-[36px]">
                {stats.ended}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table & Filter Area (Figma Exact Match) ── */}
      <div className="ds-bg-form border border-slate-100 dark:border-slate-800 rounded-[8px] p-4 flex flex-col gap-4 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)]">
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#707070]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full h-[48px] ps-12 pe-4 rounded-[8px] border border-[#E1E1E1] dark:border-border bg-white dark:bg-background text-[#000000] dark:text-white text-[16px] placeholder:text-[#707070] focus:outline-none focus:border-[#25C6DA] transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            {/* Type Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setTypeDropdownOpen(!typeDropdownOpen);
                  setStatusDropdownOpen(false);
                }}
                className="flex items-center justify-between gap-3 px-5 h-[44px] min-w-[170px] rounded-[12px] bg-white dark:bg-background border border-gray-100 dark:border-border shadow-[0px_4px_12px_rgba(0,0,0,0.08)] text-[15px] font-semibold text-[#424242] dark:text-gray-200 cursor-pointer"
              >
                <span>{typeOptions.find((o) => o.value === selectedType)?.label}</span>
                <ChevronDown className={cn("w-4 h-4 text-[#707070] transition-transform", typeDropdownOpen && "rotate-180")} />
              </button>

              {typeDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-full min-w-[170px] rounded-[12px] ds-bg-form border border-slate-100 dark:border-slate-800 border border-border shadow-xl z-30 p-1.5 flex flex-col gap-0.5">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedType(opt.value);
                        setTypeDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-start px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        selectedType === opt.value
                          ? "bg-[#25C6DA]/15 text-[#00838F] font-bold"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setTypeDropdownOpen(false);
                }}
                className="flex items-center justify-between gap-3 px-5 h-[44px] min-w-[170px] rounded-[12px] bg-white dark:bg-background border border-gray-100 dark:border-border shadow-[0px_4px_12px_rgba(0,0,0,0.08)] text-[15px] font-semibold text-[#424242] dark:text-gray-200 cursor-pointer"
              >
                <span>{statusOptions.find((o) => o.value === selectedStatus)?.label}</span>
                <ChevronDown className={cn("w-4 h-4 text-[#707070] transition-transform", statusDropdownOpen && "rotate-180")} />
              </button>

              {statusDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-full min-w-[170px] rounded-[12px] ds-bg-form border border-slate-100 dark:border-slate-800 border border-border shadow-xl z-30 p-1.5 flex flex-col gap-0.5">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(opt.value);
                        setStatusDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-start px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        selectedStatus === opt.value
                          ? "bg-[#25C6DA]/15 text-[#00838F] font-bold"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="overflow-x-auto rounded-[8px] border border-[#E2E8F0] dark:border-border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-[40px] bg-[#F1F5F9]/50 dark:bg-muted/40 border-b border-[#E2E8F0] dark:border-border">
                <th className="px-6 text-[13px] font-semibold text-[#000000] dark:text-white uppercase tracking-wider w-[60px]">
                  #
                </th>
                <th className="px-6 text-[13px] font-semibold text-[#000000] dark:text-white uppercase tracking-wider">
                  {t("list.columns.title")}
                </th>
                <th className="px-6 text-[13px] font-semibold text-[#000000] dark:text-white uppercase tracking-wider">
                  {t("list.columns.code")}
                </th>
                <th className="px-6 text-[13px] font-semibold text-[#000000] dark:text-white uppercase tracking-wider">
                  {t("list.columns.company")}
                </th>
                <th className="px-6 text-[13px] font-semibold text-[#000000] dark:text-white uppercase tracking-wider">
                  {t("list.columns.type")}
                </th>
                <th className="px-6 text-[13px] font-semibold text-[#000000] dark:text-white uppercase tracking-wider">
                  {t("list.columns.scheduled")}
                </th>
                <th className="px-6 text-[13px] font-semibold text-[#000000] dark:text-white uppercase tracking-wider">
                  {t("list.columns.status")}
                </th>
                <th className="px-6 text-[13px] font-semibold text-[#000000] dark:text-white uppercase tracking-wider text-right">
                  {tc("actions")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E2E8F0] dark:divide-border ds-bg-form border border-slate-100 dark:border-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
                  </td>
                </tr>
              ) : meetings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#707070]">
                    {t("list.empty")}
                  </td>
                </tr>
              ) : (
                meetings.map((meeting, index) => {
                  // The API returns `company_id` only, so the name is looked up.
                  const companyName = resolveCompanyName(meeting.company_id);

                  // The list response carries no roster roles, so ownership is
                  // judged by creator alone. A host or co-host who did not
                  // create the meeting still gets these actions inside the room,
                  // where the roster is available — better than showing buttons
                  // here that the API would answer with 403.
                  const isCreator = Number(meeting.created_by) === Number(user?.id);

                  let scheduledFormatted = "-";
                  if (meeting.scheduled_at) {
                    try {
                      scheduledFormatted = new Date(meeting.scheduled_at).toISOString().replace("T", " ").slice(0, 16);
                    } catch {
                      scheduledFormatted = meeting.scheduled_at.slice(0, 16);
                    }
                  }

                  return (
                    <tr
                      key={meeting.id}
                      onClick={() => handleEnterRoom(meeting.id)}
                      className="h-[76px] hover:bg-slate-50/70 dark:hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      {/* Row number */}
                      <td className="px-6 text-[13px] font-medium text-[#94A3B8]">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>

                      {/* Title */}
                      <td className="px-6">
                        <span className="text-[14px] font-semibold text-[#111827] dark:text-white hover:text-[#25C6DA] transition-colors">
                          {meeting.title}
                        </span>
                      </td>

                      {/* Code */}
                      <td className="px-6">
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(meeting.meeting_code, e)}
                          className="inline-flex items-center gap-1.5 font-mono text-[13px] font-medium text-[#424242] dark:text-gray-300 hover:text-[#25C6DA] transition-colors group"
                        >
                          <span>{meeting.meeting_code}</span>
                          <Copy className="w-3 h-3 text-muted-foreground group-hover:text-[#25C6DA] transition-colors" />
                        </button>
                      </td>

                      {/* Company */}
                      <td className="px-6 text-[13px] font-medium text-[#000000] dark:text-gray-300">
                        {companyName}
                      </td>

                      {/* Type */}
                      <td className="px-6">
                        {renderTypeBadge(meeting.type || "scheduled")}
                      </td>

                      {/* Scheduled */}
                      <td className="px-6 text-[13px] font-medium text-[#424242] dark:text-gray-300">
                        {scheduledFormatted}
                      </td>

                      {/* Status */}
                      <td className="px-6">
                        {renderStatusBadge(meeting.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {/* Join Button */}
                          <button
                            type="button"
                            onClick={() => handleEnterRoom(meeting.id)}
                            title={t("joinMeeting")}
                            className="w-8 h-8 rounded-[16px] bg-[#E6F6FE] text-[#03A9F4] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          {/* Start — only meaningful while the meeting is waiting */}
                          {isCreator && meeting.status === "waiting" && (
                            <button
                              type="button"
                              onClick={() => startMeeting(meeting.id)}
                              title={t("startMeeting")}
                              className="w-8 h-8 rounded-[16px] bg-[#EDF7EE] text-[#4CAF50] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}

                          {/* End — only while it is live */}
                          {isCreator && meeting.status === "live" && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(t("list.endConfirm"))) {
                                  endMeeting(meeting.id);
                                }
                              }}
                              title={t("endMeeting")}
                              className="w-8 h-8 rounded-[16px] bg-[#FFF7ED] text-[#F97316] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                            >
                              <PhoneOff className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit — the API rejects edits after a meeting starts */}
                          {isCreator && meeting.status === "waiting" && (
                            <button
                              type="button"
                              onClick={() => setEditingMeeting(meeting)}
                              title={t("editMeeting")}
                              className="w-8 h-8 rounded-[16px] bg-[#EDF7EE] text-[#4CAF50] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Button */}
                          {isCreator && (
                            <button
                              type="button"
                              onClick={() => setDeletingMeeting(meeting)}
                              title={t("deleteMeeting")}
                              className="w-8 h-8 rounded-[16px] bg-[#FEECEB] text-[#F44336] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Matching Figma ── */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {/* Previous Arrow */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-8 h-8 rounded-[8px] bg-[#F5F5F5]/60 dark:bg-muted flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#000000] dark:text-white" />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={cn(
                  "w-8 h-8 rounded-[8px] text-[12px] font-semibold flex items-center justify-center transition-colors",
                  isActive
                    ? "bg-[#E9F9FB] text-[#000000] dark:text-white font-bold"
                    : "ds-bg-form border border-slate-100 dark:border-slate-800 text-[#000000] dark:text-gray-300 hover:bg-gray-100"
                )}
              >
                {p}
              </button>
            );
          })}

          {/* Next Arrow */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="w-8 h-8 rounded-[8px] bg-[#F5F5F5]/60 dark:bg-muted flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[#000000] dark:text-white" />
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      <CreateMeetingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {editingMeeting && (
        <EditMeetingModal
          isOpen={Boolean(editingMeeting)}
          onClose={() => setEditingMeeting(null)}
          meeting={editingMeeting}
        />
      )}

      <JoinByCodeModal
        isOpen={isJoinByCodeOpen}
        onClose={() => setIsJoinByCodeOpen(false)}
      />

      {deletingMeeting && (
        <DeleteConfirmationModal
          isOpen={Boolean(deletingMeeting)}
          onClose={() => setDeletingMeeting(null)}
          onConfirm={() => {
            if (deletingMeeting) {
              deleteMeeting(deletingMeeting.id, {
                onSuccess: () => setDeletingMeeting(null),
              });
            }
          }}
          title={t("deleteMeeting")}
          itemName={deletingMeeting.title}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
