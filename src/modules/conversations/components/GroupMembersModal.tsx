"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Loader2, Search, UserMinus, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";

import { useConversations } from "../hooks/useConversations";
import { useParticipants } from "../hooks/useParticipants";
import type { Conversation } from "../types/conversations.types";
import {
  getInitials,
  getMemberImage,
  getMemberName,
  getMemberRole,
  getMemberUserId,
  getMembers,
} from "../utils/conversation.helpers";

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
}

/** Roles the API accepts on PUT /conversations/{id}/members/{user}/role. */
const ASSIGNABLE_ROLES = ["admin", "member"] as const;

const AVATAR_COLORS = ["bg-orange-400", "bg-blue-400", "bg-purple-500"];

/**
 * Tinted from the role's hue with color-mix so the badges stay legible on both
 * the light and dark surfaces instead of being pinned to light-mode swatches.
 */
function roleBadgeStyle(role: string): React.CSSProperties {
  const hue =
    role === "owner"
      ? "#f97316"
      : role === "admin"
        ? "#6366f1"
        : role === "moderator"
          ? "#0ea5e9"
          : "#10b981";
  return {
    backgroundColor: `color-mix(in srgb, ${hue} 16%, transparent)`,
    color: hue,
  };
}

export default function GroupMembersModal({
  isOpen,
  onClose,
  conversation,
}: GroupMembersModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const { user } = useAuth();
  const role = user?.role || "company";
  const t = useTranslations("conversations");

  const { removeMember, addMember, changeMemberRole } = useConversations(role);

  const { participants, isLoading: isParticipantsLoading } = useParticipants(role, {
    enabled: isOpen && isPickerOpen,
    isSuperAdmin: role === "super_admin",
    noCompanyLabel: t("create.noCompany"),
    // Same scope as starting a chat: an employee may only add colleagues.
    companyId: user?.company_id ?? null,
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) {
      setIsPickerOpen(false);
      setPickerSearch("");
    }
  }, [isOpen]);

  const members = useMemo(() => getMembers(conversation), [conversation]);

  const memberUserIds = useMemo(
    () => new Set(members.map((m) => String(getMemberUserId(m)))),
    [members]
  );

  const addable = useMemo(() => {
    const term = pickerSearch.trim().toLowerCase();
    return participants
      .filter((p) => !memberUserIds.has(String(p.userId)))
      .filter((p) => !term || p.name.toLowerCase().includes(term));
  }, [participants, memberUserIds, pickerSearch]);

  const translateRole = (value: string) => {
    const known = ["owner", "admin", "moderator", "member"];
    return known.includes(value)
      ? t(`membersModal.roles.${value}` as `membersModal.roles.member`)
      : value;
  };

  const runMemberAction = async (
    userId: number | string,
    action: () => Promise<unknown>,
    onSuccessMessage: string,
    fallbackError: string
  ) => {
    setBusyUserId(String(userId));
    try {
      await action();
      toast.success(onSuccessMessage);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ??
        (err as { message?: string })?.message ??
        fallbackError;
      toast.error(message);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRemove = (userId: number | string | undefined, name: string) => {
    if (!conversation?.id || userId == null) return;
    if (!window.confirm(t("membersModal.confirmRemove", { name }))) return;
    void runMemberAction(
      userId,
      () => removeMember({ id: conversation.id, userId }),
      t("membersModal.removed", { name }),
      t("membersModal.removeFailed")
    );
  };

  const handleRoleChange = (
    userId: number | string | undefined,
    name: string,
    nextRole: string
  ) => {
    if (!conversation?.id || userId == null) return;
    void runMemberAction(
      userId,
      () => changeMemberRole({ id: conversation.id, userId, memberRole: nextRole }),
      t("membersModal.roleChanged", { name, role: translateRole(nextRole) }),
      t("membersModal.roleChangeFailed")
    );
  };

  const handleAdd = (userId: number | string, name: string) => {
    if (!conversation?.id) return;
    void runMemberAction(
      userId,
      () => addMember({ id: conversation.id, user_id: userId }),
      t("membersModal.roleChanged", { name, role: translateRole("member") }),
      t("membersModal.removeFailed")
    );
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] ds-bg-form shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[var(--color-border-form)] bg-[var(--color-bg)] px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ds-text-gray transition-colors hover:bg-[var(--color-bg)] rtl:rotate-180"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold ds-text-primary sm:text-2xl">
                {t("membersModal.title")}
              </h2>
              <p className="mt-1 text-sm font-medium ds-text-gray-100">
                {t("membersModal.count", { count: members.length })}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsPickerOpen((open) => !open)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full border-none bg-[var(--color-bg-primary)] px-5 font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            {isPickerOpen ? <X size={16} strokeWidth={2.5} /> : <UserPlus size={16} strokeWidth={2.5} />}
            <span className="hidden sm:inline">{t("membersModal.addMember")}</span>
          </Button>
        </div>

        {/* Add-member picker */}
        {isPickerOpen && (
          <div className="border-b border-[var(--color-border-form)] bg-[var(--color-bg)] px-6 py-4 sm:px-8">
            <div className="relative mb-3">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 ds-text-gray-200"
                size={15}
              />
              <input
                type="text"
                value={pickerSearch}
                onChange={(event) => setPickerSearch(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-10 w-full rounded-lg border border-[var(--color-border-inputs)] ds-bg-form ps-9 pe-3 text-sm ds-text-gray focus:border-[var(--color-border-inputs-focus)] focus:outline-none"
              />
            </div>

            <div className="custom-scrollbar max-h-48 space-y-1 overflow-y-auto">
              {isParticipantsLoading ? (
                <p className="py-3 text-center text-sm ds-text-gray-100">
                  {t("create.loadingParticipants")}
                </p>
              ) : addable.length === 0 ? (
                <p className="py-3 text-center text-sm ds-text-gray-100">{t("create.noUsers")}</p>
              ) : (
                addable.map((person) => (
                  <button
                    key={person.key}
                    type="button"
                    disabled={busyUserId === String(person.userId)}
                    onClick={() => handleAdd(person.userId, person.name)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-start transition-colors hover:ds-bg-form disabled:opacity-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-primary)] text-[11px] font-bold text-white">
                      {getInitials(person.name)}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium ds-text-gray">
                      {person.name}
                    </span>
                    {busyUserId === String(person.userId) ? (
                      <Loader2 size={15} className="shrink-0 animate-spin ds-text-gray-200" />
                    ) : (
                      <UserPlus size={15} className="shrink-0 text-[var(--color-text-brand)]" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Members */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6 sm:p-8">
          {members.length === 0 ? (
            <div className="py-8 text-center text-sm font-medium ds-text-gray-200">
              {t("membersModal.empty")}
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member, index) => {
                const userId = getMemberUserId(member);
                const name = getMemberName(member);
                const image = getMemberImage(member);
                const memberRole = getMemberRole(member);
                const isBusy = busyUserId === String(userId);
                const isSelf = String(userId) === String(user?.id);
                const color = AVATAR_COLORS[index % AVATAR_COLORS.length];

                return (
                  <div
                    key={String(userId ?? member.id ?? index)}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[var(--color-border-form)] bg-[var(--color-bg)] p-3 transition-colors hover:border-[var(--color-border-inputs-focus)]"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          className="h-[46px] w-[46px] shrink-0 rounded-full object-cover shadow-sm"
                        />
                      ) : (
                        <div
                          className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}
                        >
                          {getInitials(name)}
                        </div>
                      )}
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate text-[15px] font-bold ds-text-primary">
                          {name}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={roleBadgeStyle(memberRole)}
                        >
                          {translateRole(memberRole)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <select
                        value={ASSIGNABLE_ROLES.includes(memberRole as "admin") ? memberRole : "member"}
                        disabled={isBusy || memberRole === "owner"}
                        onChange={(event) =>
                          handleRoleChange(userId, name, event.target.value)
                        }
                        className="h-9 rounded-[12px] border border-[var(--color-border-inputs)] ds-bg-form px-3 text-[13px] font-bold ds-text-gray transition-colors hover:bg-[var(--color-bg)] focus:border-[var(--color-border-inputs-focus)] focus:outline-none disabled:opacity-50"
                      >
                        {ASSIGNABLE_ROLES.map((value) => (
                          <option key={value} value={value}>
                            {translateRole(value)}
                          </option>
                        ))}
                      </select>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleRemove(userId, name)}
                          disabled={isBusy}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100 disabled:opacity-50 sm:w-auto sm:px-4 sm:gap-1.5"
                        >
                          {isBusy ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <UserMinus size={14} />
                          )}
                          <span className="hidden sm:inline">{t("membersModal.remove")}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
