"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Info, Search, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useParticipants } from "../hooks/useParticipants";
import { getInitials } from "../utils/conversation.helpers";

import type { ConversationType } from "../types/conversations.types";

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (
    userIds: (number | string)[],
    /** Backend enum, derived from who was selected — not the private/group UI mode. */
    type: ConversationType,
    name: string,
    imageFile?: File
  ) => void;
  isCreating: boolean;
}

const AVATAR_COLORS = [
  "bg-[#6366f1]",
  "bg-[#0ea5e9]",
  "bg-[#a855f7]",
  "bg-[#ec4899]",
  "bg-[#f59e0b]",
];

export default function CreateConversationModal({
  isOpen,
  onClose,
  onStartChat,
  isCreating,
}: CreateConversationModalProps) {
  const { user } = useAuth();
  const role = user?.role || "company";
  const t = useTranslations("conversations");

  const [mounted, setMounted] = useState(false);
  const [conversationType, setConversationType] = useState<"private" | "group" | "">("");
  const [groupName, setGroupName] = useState("");
  const [groupPicture, setGroupPicture] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  /** Holds `kind:userId` keys — a raw user id is not unique across entity types. */
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = role === "super_admin";

  const { participants, isLoading } = useParticipants(role, {
    enabled: isOpen,
    isSuperAdmin,
    noCompanyLabel: t("create.noCompany"),
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    setConversationType("");
    setSelectedKeys(new Set());
    setGroupName("");
    setGroupPicture(null);
    setSearch("");
  }, [isOpen]);

  // Never offer a conversation with yourself.
  const selectable = useMemo(
    () => participants.filter((p) => String(p.userId) !== String(user?.id)),
    [participants, user?.id]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return selectable;
    return selectable.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.email ?? "").toLowerCase().includes(term) ||
        p.company.toLowerCase().includes(term)
    );
  }, [selectable, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((p) => {
      const list = map.get(p.company) ?? [];
      list.push(p);
      map.set(p.company, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const handleToggle = (key: string) => {
    setSelectedKeys((prev) => {
      if (conversationType === "private") return new Set([key]);
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setGroupPicture(file);
  };

  const isValid =
    selectedKeys.size > 0 &&
    (conversationType === "private" || (conversationType === "group" && groupName.trim().length > 0));

  const handleSave = () => {
    if (!isValid || !conversationType) return;

    const chosen = selectable.filter((p) => selectedKeys.has(p.key));
    const userIds = chosen.map((p) => p.userId);

    // The backend `type` depends on the audience, not the private/group mode:
    // any client in the conversation makes it a client_chat, otherwise team_chat.
    const apiType: ConversationType = chosen.some((p) => p.kind === "client")
      ? "client_chat"
      : "team_chat";

    const title =
      conversationType === "private" ? chosen[0]?.name ?? "Chat" : groupName.trim();

    onStartChat(userIds, apiType, title, groupPicture ?? undefined);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="mt-auto flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl ds-bg-form shadow-2xl sm:mt-0 sm:max-h-[90vh] sm:rounded-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 ds-bg-form px-5 pb-4 pt-6 sm:px-10 sm:pb-6 sm:pt-8">
          <div className="mb-1 flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ds-text-primary transition-colors hover:bg-[var(--color-bg)] rtl:rotate-180"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <h2 className="text-xl font-bold leading-tight ds-text-primary sm:text-[28px]">
              {t("create.title")}
            </h2>
          </div>
          <p className="ps-11 text-xs font-medium ds-text-gray-100 sm:ps-12 sm:text-sm">
            {t("create.subtitle")}
          </p>
        </div>

        {/* Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden ds-bg-form px-5 pb-6 sm:px-10 sm:pb-8">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-bold ds-text-primary">
                {t("create.type")}
              </label>
              <Select
                value={conversationType}
                onValueChange={(value) => {
                  setConversationType(value as "private" | "group");
                  setSelectedKeys(new Set());
                }}
              >
                <SelectTrigger className="h-12 w-full rounded-xl border border-[var(--color-border-form)] ds-bg-form px-4 text-sm ds-text-gray shadow-sm hover:bg-[var(--color-bg)] focus:border-[var(--color-border-inputs-focus)] focus:ring-1 focus:ring-[var(--color-border-inputs-focus)]">
                  <SelectValue placeholder={t("create.typePlaceholder")} />
                </SelectTrigger>
                <SelectContent className="z-[150] rounded-xl border border-[var(--color-border-form)] ds-bg-form p-1 shadow-lg">
                  <SelectItem value="private" className="cursor-pointer rounded-lg px-3 py-2.5 text-sm">
                    {t("create.private")}
                  </SelectItem>
                  <SelectItem value="group" className="cursor-pointer rounded-lg px-3 py-2.5 text-sm">
                    {t("create.group")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {conversationType && (
              <>
                {conversationType === "group" && (
                  <>
                    <div>
                      <label className="mb-2 block text-xs font-bold ds-text-primary">
                        {t("create.groupName")}
                      </label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                        placeholder={t("create.groupNamePlaceholder")}
                        className="h-12 w-full rounded-xl border border-[var(--color-border-form)] ds-bg-form px-4 text-sm ds-text-gray shadow-sm focus:border-[var(--color-border-inputs-focus)] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold ds-text-primary">
                        {t("create.groupPicture")}
                      </label>
                      <div className="flex w-full items-center gap-2 overflow-hidden rounded-xl border border-[var(--color-border-form)] ds-bg-form p-1.5 shadow-sm sm:gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-9 shrink-0 rounded-lg border border-[var(--color-border-form)] ds-bg-form px-3 text-xs font-medium ds-text-gray transition-colors hover:bg-[var(--color-bg)] sm:px-4 sm:text-sm"
                        >
                          {t("create.chooseFile")}
                        </button>
                        <span className="flex-1 truncate px-1 text-xs ds-text-gray-200 sm:px-2 sm:text-sm">
                          {groupPicture ? groupPicture.name : t("create.noFileChosen")}
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-bold ds-text-primary">
                      {t("create.participants")}
                    </label>
                    {selectedKeys.size > 0 && (
                      <span className="text-[11px] font-bold text-[var(--color-text-brand)]">
                        {t("create.selected", { count: selectedKeys.size })}
                      </span>
                    )}
                  </div>

                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--color-border-form)] ds-bg-form px-4 py-3.5 shadow-sm">
                    <Info size={14} className="shrink-0 ds-text-gray-100" />
                    <span className="text-[13px] font-medium ds-text-gray-100">
                      {conversationType === "private"
                        ? t("create.hintPrivate")
                        : t("create.hintGroup")}
                    </span>
                  </div>

                  <div className="relative mb-3">
                    <Search
                      className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 ds-text-gray-200"
                      size={15}
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t("searchPlaceholder")}
                      className="h-11 w-full rounded-xl border border-[var(--color-border-form)] ds-bg-form ps-10 pe-4 text-sm ds-text-gray shadow-sm focus:border-[var(--color-border-inputs-focus)] focus:outline-none"
                    />
                  </div>

                  {isLoading ? (
                    <div className="p-4 text-center text-sm ds-text-gray-100">
                      {t("create.loadingParticipants")}
                    </div>
                  ) : grouped.length === 0 ? (
                    <div className="p-4 text-center text-sm ds-text-gray-100">
                      {t("create.noUsers")}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {grouped.map(([companyName, people], groupIndex) => (
                        <div key={companyName} className="mb-6 space-y-2">
                          <div className="mb-3 mt-1 flex items-center gap-2">
                            <h4 className="text-sm font-bold uppercase tracking-wider ds-text-gray">
                              {companyName}
                            </h4>
                            <div className="h-px flex-1 bg-[var(--color-border-inputs)]" />
                          </div>

                          <div className="space-y-2">
                            {people.map((person, index) => {
                              const isSelected = selectedKeys.has(person.key);
                              const color =
                                AVATAR_COLORS[(index + groupIndex) % AVATAR_COLORS.length];

                              return (
                                <label
                                  key={person.key}
                                  className={`flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border p-3 transition-all sm:gap-4 sm:p-3.5 ${
                                    isSelected
                                      ? "border-[var(--color-border-inputs-focus)] bg-[var(--color-bg-primary-200)]"
                                      : "border-[var(--color-border-form)] ds-bg-form shadow-sm hover:border-[var(--color-border-inputs)]"
                                  }`}
                                >
                                  <input
                                    type={conversationType === "private" ? "radio" : "checkbox"}
                                    name="participant"
                                    checked={isSelected}
                                    onChange={() => handleToggle(person.key)}
                                    className="h-4 w-4 shrink-0 accent-[var(--color-bg-primary)]"
                                  />

                                  {person.image ? (
                                    <img
                                      src={person.image}
                                      alt=""
                                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div
                                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ${color}`}
                                    >
                                      {getInitials(person.name)}
                                    </div>
                                  )}

                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[13px] font-bold ds-text-primary sm:text-[14px]">
                                      {person.name}
                                    </span>
                                    {person.email && (
                                      <span className="block truncate text-[11px] ds-text-gray-200">
                                        {person.email}
                                      </span>
                                    )}
                                  </span>

                                  <span className="shrink-0 rounded-full bg-[var(--color-bg-primary)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-brand)] sm:px-3 sm:text-[11px]">
                                    {person.roleLabel}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <Button
                    onClick={handleSave}
                    disabled={isCreating || !isValid}
                    className="flex h-11 items-center gap-2 rounded-lg bg-[var(--color-bg-primary)] px-8 font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    <Send size={16} strokeWidth={2.5} className="rtl:rotate-180" />
                    {t("create.save")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="h-11 rounded-lg border-none bg-[var(--color-bg)] px-8 font-bold ds-text-primary hover:bg-[var(--color-bg)]"
                  >
                    {t("create.cancel")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
