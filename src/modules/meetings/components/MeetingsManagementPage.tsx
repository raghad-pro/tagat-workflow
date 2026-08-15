"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Lock,
  Radio,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";

import { PageHeader, type PageHeaderAction } from "@/components/molecules/Pageheader";
import { StatsGrid, type StatItem } from "@/components/molecules/Statsgrid";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, type TableColumn, type TableAction } from "@/components/molecules/Datatable";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";

import {
  useMeetings,
  useDeleteMeeting,
} from "../hooks/useMeetings";
import type { Meeting, MeetingStatus, MeetingType } from "../types/meetings.types";
import CreateMeetingModal from "./CreateMeetingModal";
import EditMeetingModal from "./EditMeetingModal";
import JoinByCodeModal from "./JoinByCodeModal";

const PAGE_SIZE = 10;

export function MeetingsManagementPage() {
  const t = useTranslations("meetings");
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || "employee";

  // Filter & pagination states
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinByCodeOpen, setIsJoinByCodeOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null);

  // Queries & Mutations
  const { data: meetingsResponse, isLoading } = useMeetings({
    search: search || undefined,
    status: selectedStatus !== "all" ? (selectedStatus as MeetingStatus) : undefined,
    type: selectedType !== "all" ? (selectedType as MeetingType) : undefined,
    page: currentPage,
    per_page: PAGE_SIZE,
  });

  const { mutate: deleteMeeting, isPending: isDeleting } = useDeleteMeeting();

  const meetings = useMemo(() => {
    return meetingsResponse?.data || [];
  }, [meetingsResponse]);

  const totalItems = meetingsResponse?.total || meetings.length;

  // Stats calculation
  const stats: StatItem[] = useMemo(() => {
    const total = totalItems;
    const upcoming = meetings.filter((m) => m.status === "waiting").length;
    const inProgress = meetings.filter((m) => m.status === "in_progress").length;
    const ended = meetings.filter((m) => m.status === "ended").length;

    return [
      {
        label: t("stats.total"),
        value: total,
        icon: Video,
      },
      {
        label: t("stats.inProgress"),
        value: inProgress,
        icon: Radio,
      },
      {
        label: t("stats.upcoming"),
        value: upcoming,
        icon: Calendar,
      },
      {
        label: t("stats.ended"),
        value: ended,
        icon: Clock,
      },
    ];
  }, [meetings, totalItems, t]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success(t("codeCopied"));
  };

  const handleCopyLink = (meeting: Meeting) => {
    const url = `${window.location.origin}/meetings/${meeting.id}`;
    navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  };

  const handleEnterRoom = (meetingId: number | string) => {
    router.push(`/meetings/${meetingId}`);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/30 gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {t("status.in_progress")}
          </Badge>
        );
      case "waiting":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1.5">
            <Clock className="w-3 h-3" />
            {t("status.waiting")}
          </Badge>
        );
      case "ended":
        return (
          <Badge variant="secondary" className="text-muted-foreground gap-1.5">
            {t("status.ended")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="gap-1.5">
            {t("status.cancelled")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Columns definition
  const columns: TableColumn<Meeting>[] = [
    {
      key: "title",
      header: t("columns.title"),
      render: (meeting) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span
              className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors"
              onClick={() => handleEnterRoom(meeting.id)}
            >
              {meeting.title}
            </span>
            {meeting.is_private && (
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
          {meeting.description && (
            <span className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
              {meeting.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "meeting_code",
      header: t("columns.code"),
      render: (meeting) => (
        <button
          onClick={(e) => handleCopyCode(meeting.meeting_code, e)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/60 hover:bg-muted font-mono text-xs font-medium text-foreground transition-colors group cursor-pointer"
        >
          <span>{meeting.meeting_code}</span>
          <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      ),
    },
    {
      key: "type",
      header: t("columns.type"),
      render: (meeting) => (
        <Badge variant="outline" className="text-xs capitalize">
          {t(`type.${meeting.type || "scheduled"}`)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (meeting) => renderStatusBadge(meeting.status),
    },
    {
      key: "scheduled_at",
      header: t("columns.scheduledAt"),
      render: (meeting) => {
        if (!meeting.scheduled_at) return <span className="text-muted-foreground text-xs">-</span>;
        try {
          const date = new Date(meeting.scheduled_at);
          return (
            <div className="text-xs text-muted-foreground flex flex-col">
              <span className="font-medium text-foreground">{date.toLocaleDateString("ar-EG")}</span>
              <span>{date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          );
        } catch {
          return <span className="text-xs text-muted-foreground">{meeting.scheduled_at}</span>;
        }
      },
    },
    {
      key: "participants",
      header: t("columns.participants"),
      render: (meeting) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>
            {meeting.participants_count || meeting.participants?.length || 0} / {meeting.max_participants || 25}
          </span>
        </div>
      ),
    },
  ];

  // Actions
  const actions: TableAction<Meeting>[] = [
    {
      label: t("joinMeeting"),
      icon: ExternalLink,
      onClick: (meeting) => handleEnterRoom(meeting.id),
      colorScheme: "send",
    },
    {
      label: t("copyLink"),
      icon: Copy,
      onClick: (meeting) => handleCopyLink(meeting),
    },
    {
      label: t("editMeeting"),
      icon: Edit2,
      onClick: (meeting) => setEditingMeeting(meeting),
      colorScheme: "edit",
      hidden: () => role === "client",
    },
    {
      label: t("deleteMeeting"),
      icon: Trash2,
      onClick: (meeting) => setDeletingMeeting(meeting),
      colorScheme: "delete",
      hidden: () => role === "client",
    },
  ];

  // Header Actions
  const headerActions: PageHeaderAction[] = [
    {
      label: t("joinByCode"),
      onClick: () => setIsJoinByCodeOpen(true),
      icon: Video,
      variant: "outline",
    },
  ];

  if (role !== "client") {
    headerActions.push({
      label: t("createMeeting"),
      onClick: () => setIsCreateOpen(true),
      icon: Plus,
      variant: "solid",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={headerActions}
      />

      {/* Stats Cards */}
      <StatsGrid stats={stats} />

      {/* Filter & Search Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPlaceholder")}
        filters={[
          {
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
              { label: t("status.all"), value: "all" },
              { label: t("status.waiting"), value: "waiting" },
              { label: t("status.in_progress"), value: "in_progress" },
              { label: t("status.ended"), value: "ended" },
              { label: t("status.cancelled"), value: "cancelled" },
            ],
          },
          {
            value: selectedType,
            onChange: setSelectedType,
            options: [
              { label: t("type.all"), value: "all" },
              { label: t("type.scheduled"), value: "scheduled" },
              { label: t("type.instant"), value: "instant" },
              { label: t("type.recurring"), value: "recurring" },
            ],
          },
        ]}
      />

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={meetings}
          actions={actions}
          isLoading={isLoading}
          emptyMessage={t("emptyDesc")}
          pagination={{
            currentPage,
            pageSize: PAGE_SIZE,
            totalItems,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      {/* Modals */}
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
