"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  MessagesSquare,
  AlertTriangle,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  User as UserIcon,
  Users,
  X,
  Edit2,
} from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useConversation, useConversations } from "../hooks/useConversations";
import CreateConversationModal from "./CreateConversationModal";
import GroupMembersModal from "./GroupMembersModal";
import EditGroupModal from "./EditGroupModal";
import { ConversationListSkeleton, MessagesSkeleton } from "./ConversationSkeleton";
import type {
  Conversation,
  ConversationType,
  CreateConversationPayload,
} from "../types/conversations.types";
import {
  avatarFallbackUrl,
  getConversationImage,
  getConversationTitle,
  getInitials,
  getLastActivityAt,
  getLastMessage,
  getMembers,
  getMessageAttachments,
  getMessageSender,
  getMessageText,
  isGroupConversation,
  toTimestamp,
} from "../utils/conversation.helpers";
import {
  formatClock,
  formatDayLabel,
  formatListStamp,
  groupMessages,
} from "../utils/message.format";

const COMMON_EMOJIS = ["😀", "😂", "🥰", "😎", "🤔", "😭", "👍", "🙏", "🔥", "❤️", "🎉", "✨"];
const MAX_FILE_MB = 10;
const SEARCH_DEBOUNCE_MS = 400;
/** Only auto-scroll when the reader is already near the bottom. */
const STICK_TO_BOTTOM_PX = 120;

export default function ConversationsManagementPage() {
  const { user } = useAuth();
  const role = user?.role || "company";
  const t = useTranslations("conversations");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("c");

  const [activeConversationId, setActiveConversationId] = useState<number | string | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGroupMembersModalOpen, setIsGroupMembersModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const readSentRef = useRef<Set<string>>(new Set());
  const stickToBottomRef = useRef(true);
  const appliedDeepLinkRef = useRef<string | null>(null);

  /**
   * Open the conversation named in the URL (`?c=<id>`) — this is how the navbar
   * dropdown hands one over. Applied once per id: without the guard, picking a
   * different chat inside the page would be undone on the next render by the
   * query string that is still sitting in the URL.
   */
  useEffect(() => {
    if (!deepLinkId || appliedDeepLinkRef.current === deepLinkId) return;
    appliedDeepLinkRef.current = deepLinkId;
    setActiveConversationId(deepLinkId);
    stickToBottomRef.current = true;
  }, [deepLinkId]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const listParams = useMemo(
    () => (debouncedSearch ? { search: debouncedSearch } : undefined),
    [debouncedSearch]
  );

  const {
    conversations: unsortedConversations,
    isLoading: isConversationsLoading,
    isError: isConversationsError,
    refetch: refetchConversations,
    sendMessage,
    isSendingMessage,
    createConversation,
    isCreating,
    markAsRead,
  } = useConversations(role, listParams);

  const {
    conversation: activeConversation,
    messages,
    isLoading: isChatLoading,
    isError: isChatError,
    refetch: refetchThread,
  } = useConversation(role, activeConversationId);

  // Most recently active first — the endpoint returns no explicit ordering.
  // Compared as parsed instants, since the API mixes two timestamp formats.
  const conversations = useMemo(
    () =>
      [...unsortedConversations].sort(
        (a, b) => toTimestamp(getLastActivityAt(b)) - toTimestamp(getLastActivityAt(a))
      ),
    [unsortedConversations]
  );

  const listConversation = useMemo(
    () => conversations.find((c: Conversation) => String(c.id) === String(activeConversationId)),
    [conversations, activeConversationId]
  );

  const currentConversation = activeConversation ?? listConversation ?? null;
  const isGroup = isGroupConversation(currentConversation);
  const memberCount = getMembers(currentConversation).length;

  /**
   * The detail endpoint serves soft-deleted conversations while the list filters
   * them out, so a chat can be readable and writable yet permanently invisible.
   * Surfacing that beats silently letting the user type into a void.
   */
  const isOrphaned = Boolean(
    activeConversationId &&
      activeConversation &&
      !listConversation &&
      !isConversationsLoading &&
      !isConversationsError &&
      !debouncedSearch
  );

  const daySections = useMemo(() => groupMessages(messages, user?.id), [messages, user?.id]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + Number(c.unread_count ?? 0), 0),
    [conversations]
  );

  useEffect(() => {
    if (!activeConversationId) return;
    const key = String(activeConversationId);
    const unread = Number(listConversation?.unread_count ?? 0);
    if (unread > 0 && !readSentRef.current.has(key)) {
      readSentRef.current.add(key);
      markAsRead(activeConversationId);
    }
  }, [activeConversationId, listConversation?.unread_count, markAsRead]);

  // Jump to the newest message, but don't yank the view if the user scrolled up
  // to read history while polling brings in new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, activeConversationId]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < STICK_TO_BOTTOM_PX;
  };

  const handleSelectConversation = (id: number | string) => {
    setActiveConversationId(id);
    setMessageBody("");
    setPendingFiles([]);
    stickToBottomRef.current = true;
  };

  const handleFilesPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    const accepted = picked.filter((file) => {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(t("fileTooLarge", { name: file.name, size: MAX_FILE_MB }));
        return false;
      }
      return true;
    });
    if (accepted.length > 0) setPendingFiles((prev) => [...prev, ...accepted]);
    event.target.value = "";
  };

  const handleStartNewChat = useCallback(
    async (
      userIds: (number | string)[],
      type: ConversationType,
      title: string,
      _imageFile?: File
    ) => {
      const ids = userIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
      if (ids.length === 0) return;

      const isGroupChat = ids.length > 1;
      const toastId = toast.loading(
        isGroupChat
          ? t("create.creatingGroup", { name: title })
          : t("create.creatingPrivate", { name: title })
      );

      try {
        // The server derives is_group from the member count and only stores a
        // title for groups; a 1-on-1 title is left to the client to display.
        const payload: CreateConversationPayload = {
          type,
          users: ids,
          ...(isGroupChat ? { title } : {}),
        };
        const created = await createConversation(payload);

        // The server de-duplicates 1-on-1 chats, including against *soft-deleted*
        // ones — so "created" can hand back a conversation the list will never
        // show. Confirm against a fresh list before claiming success.
        const wasExisting = conversations.some((c) => String(c.id) === String(created?.id));
        const { data: fresh } = await refetchConversations();
        const isVisible = fresh?.data?.some((c) => String(c.id) === String(created?.id));

        if (created?.id && !isVisible) {
          toast.error(t("orphanedToast"), { id: toastId });
        } else {
          toast.success(wasExisting ? t("create.opened") : t("create.created"), {
            id: toastId,
          });
        }

        setIsCreateModalOpen(false);
        if (created?.id) handleSelectConversation(created.id);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
            ?.message ??
          (err as { message?: string })?.message ??
          t("create.createFailed");
        toast.error(message, { id: toastId });
      }
    },
    [createConversation, conversations, refetchConversations, t]
  );

  const submitMessage = async () => {
    const text = messageBody.trim();
    if ((!text && pendingFiles.length === 0) || !activeConversationId || isSendingMessage) return;

    const files = pendingFiles;
    setMessageBody("");
    setPendingFiles([]);
    stickToBottomRef.current = true;

    try {
      await sendMessage({
        id: activeConversationId,
        message: text,
        files,
        currentUser: user ? { id: user.id, name: user.name, image: user.image } : undefined,
      });
    } catch (err: unknown) {
      setMessageBody(text);
      setPendingFiles(files);
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ??
        (err as { message?: string })?.message ??
        t("sendFailed");
      toast.error(message);
    }
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter inserts a newline.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  };

  // Grow the composer with its content, up to a few lines.
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [messageBody]);

  const canSend = Boolean(messageBody.trim() || pendingFiles.length > 0);

  return (
    <div
      className="flex h-[calc(100vh-120px)] min-h-[520px] w-full overflow-hidden rounded-[24px] ds-bg-form transition-all duration-300"
      style={{
        border: "1px solid var(--color-border-form)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`${
          activeConversationId ? "hidden md:flex" : "flex"
        } w-full flex-col md:w-[350px] md:min-w-[300px] lg:w-[380px]`}
        style={{ borderInlineEnd: "1px solid var(--color-border-form)" }}
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-6">
          <div className="flex items-center gap-2.5">
            <h2 className="ds-text-primary text-lg font-bold">{t("title")}</h2>
            {totalUnread > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-bg-primary)] px-1.5 text-[11px] font-bold text-white">
                {totalUnread}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            aria-label={t("create.title")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-primary)] text-white transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95"
            style={{ boxShadow: "0 4px 14px 0 color-mix(in srgb, var(--color-bg-primary) 40%, transparent)" }}
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 pb-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 ds-text-gray-200"
              size={15}
            />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="ds-text-primary h-12 w-full rounded-full bg-[var(--color-bg)] ps-11 pe-9 text-[13px] outline-none transition-all duration-300 placeholder:text-[var(--color-text-gray-200)] focus:bg-[var(--color-bg-form)] focus:shadow-sm"
              style={{ border: "1px solid var(--color-border-form)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-border-inputs-focus)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border-form)")}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute end-3 top-1/2 -translate-y-1/2 ds-text-gray-200 hover:ds-text-primary"
                aria-label={t("removeAttachment")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          {isConversationsLoading ? (
            <ConversationListSkeleton />
          ) : isConversationsError ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="ds-text-gray-100 text-sm">{t("loadFailed")}</p>
              <Button variant="outline" size="sm" onClick={() => refetchConversations()}>
                {t("retry")}
              </Button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <MessagesSquare size={28} className="ds-text-gray-200" />
              <p className="ds-text-gray-100 text-sm">
                {debouncedSearch ? t("create.noUsers") : t("noConversations")}
              </p>
            </div>
          ) : (
            conversations.map((conv: Conversation) => {
              const isActive = String(activeConversationId) === String(conv.id);
              const convTitle = getConversationTitle(conv, user?.id, t("title"));
              const convImage = getConversationImage(conv, user?.id);
              const unread = Number(conv.unread_count ?? 0);
              const lastMessage = getLastMessage(conv);
              const preview = lastMessage
                ? getMessageText(lastMessage) || t("attachFile")
                : t("noLastMessage");
              const convIsGroup = isGroupConversation(conv);

              return (
                <button
                  type="button"
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className="group relative flex w-full items-center gap-3 rounded-[16px] p-3 text-start transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    backgroundColor: isActive
                      ? "var(--color-bg-primary-200)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "var(--color-bg-form)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {isActive && (
                    <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-[var(--color-bg-primary)]" />
                  )}

                  <div className="relative shrink-0">
                    {convImage ? (
                      <img
                        src={convImage}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-bg-primary-200)] text-[13px] font-bold text-[var(--color-text-brand)]">
                        {convIsGroup ? <Users size={17} /> : getInitials(convTitle)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-baseline justify-between gap-2">
                      <h4
                        className={`truncate text-[14px] ${
                          unread > 0 ? "font-bold" : "font-semibold"
                        }`}
                        style={{
                          color: isActive
                            ? "var(--color-text-brand)"
                            : "var(--color-text-primary)",
                        }}
                      >
                        {convTitle}
                      </h4>
                      <span className="ds-text-gray-200 shrink-0 text-[11px] font-medium">
                        {formatListStamp(getLastActivityAt(conv), locale)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-[12px] ${
                          unread > 0 ? "ds-text-gray font-semibold" : "ds-text-gray-200"
                        }`}
                      >
                        {preview}
                      </p>
                      {unread > 0 && (
                        <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-primary)] px-1 text-[10px] font-bold text-white">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="p-3" style={{ borderTop: "1px solid var(--color-border-form)" }}>
          <div className="flex items-center gap-3 rounded-xl bg-[var(--color-bg)] p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-bg-primary)] text-white">
              {user?.image ? (
                <img src={user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserIcon size={17} strokeWidth={2.5} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="ds-text-primary truncate text-[13px] font-bold">{user?.name}</h4>
              <p className="ds-text-gray-200 truncate text-[11px]">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Chat ─────────────────────────────────────────────────────────── */}
      <section
        className={`${
          activeConversationId ? "flex" : "hidden md:flex"
        } relative min-w-0 flex-1 flex-col`}
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        {activeConversationId && currentConversation ? (
          <>
            {/* Header */}
            <header
              className="flex h-[72px] shrink-0 items-center justify-between gap-3 px-4 md:px-6 ds-bg-form"
              style={{ borderBottom: "1px solid var(--color-border-form)" }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveConversationId(null)}
                  className="ds-text-gray flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-[var(--color-bg)] md:hidden rtl:rotate-180"
                  aria-label={t("title")}
                >
                  <ArrowLeft size={20} />
                </button>

                {getConversationImage(currentConversation, user?.id) ? (
                  <img
                    src={getConversationImage(currentConversation, user?.id) as string}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-primary-200)] text-[13px] font-bold text-[var(--color-text-brand)]">
                    {isGroup ? (
                      <Users size={16} />
                    ) : (
                      getInitials(getConversationTitle(currentConversation, user?.id))
                    )}
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="ds-text-primary truncate text-[15px] font-bold leading-tight">
                    {getConversationTitle(currentConversation, user?.id)}
                  </h3>
                  <p className="ds-text-gray-200 mt-0.5 truncate text-[12px]">
                    {isGroup
                      ? t("membersModal.count", { count: memberCount })
                      : t("privateChat")}
                  </p>
                </div>
              </div>

              {isGroup && (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setIsGroupMembersModalOpen(true)}
                    className="h-9 gap-2 rounded-full border-none bg-[var(--color-bg-primary-200)] px-3.5 text-[13px] font-bold text-[var(--color-text-brand)] hover:opacity-80 sm:px-4"
                  >
                    <Users size={15} strokeWidth={2.5} />
                    <span className="hidden sm:inline">{t("members")}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditGroupModalOpen(true)}
                    className="ds-text-gray h-9 w-9 rounded-full border-none p-0 hover:bg-[var(--color-bg)]"
                    aria-label={t("edit")}
                  >
                    <Edit2 size={15} strokeWidth={2.5} />
                  </Button>
                </div>
              )}
            </header>

            {isOrphaned && (
              <div
                className="flex shrink-0 items-start gap-2.5 px-4 py-3 md:px-6"
                style={{
                  backgroundColor: "color-mix(in srgb, #f97316 12%, transparent)",
                  borderBottom: "1px solid color-mix(in srgb, #f97316 30%, transparent)",
                }}
                role="status"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#f97316]" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#f97316]">{t("orphanedTitle")}</p>
                  <p className="ds-text-gray mt-0.5 text-[12px] leading-relaxed">
                    {t("orphanedHint")}
                  </p>
                </div>
              </div>
            )}

            {/* Thread */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6 md:px-8"
            >
              {isChatLoading && messages.length === 0 ? (
                <MessagesSkeleton />
              ) : isChatError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <p className="ds-text-gray-100 text-sm">{t("threadLoadFailed")}</p>
                  <Button variant="outline" size="sm" onClick={() => refetchThread()}>
                    {t("retry")}
                  </Button>
                </div>
              ) : daySections.length > 0 ? (
                <div className="flex w-full flex-col gap-1">
                  {daySections.map((section) => (
                    <div key={section.day} className="flex flex-col gap-1">
                      {/* Date separator */}
                      <div className="my-4 flex items-center justify-center">
                        <span
                          className="ds-text-gray-100 rounded-full px-3 py-1 text-[11px] font-semibold ds-bg-form"
                          style={{ border: "1px solid var(--color-border-form)" }}
                        >
                          {formatDayLabel(section.day, locale, {
                            today: t("today"),
                            yesterday: t("yesterday"),
                          })}
                        </span>
                      </div>

                      {section.groups.map((group, groupIndex) => {
                        const first = group.messages[0];
                        const sender = getMessageSender(first);
                        const senderName =
                          sender?.name || (group.isMine ? user?.name : t("create.noUsers"));
                        const senderImage = sender?.image;
                        const showAvatar = isGroup && !group.isMine;

                        return (
                          <div
                            key={`${section.day}-${groupIndex}`}
                            className={`mb-3 flex gap-2.5 ${
                              group.isMine ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            {showAvatar &&
                              (senderImage ? (
                                <img
                                  src={senderImage}
                                  alt=""
                                  className="mt-auto h-7 w-7 shrink-0 rounded-full object-cover"
                                />
                              ) : (
                                <div className="mt-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-primary-200)] text-[10px] font-bold text-[var(--color-text-brand)]">
                                  {getInitials(senderName ?? "")}
                                </div>
                              ))}

                            <div
                              className={`flex min-w-0 max-w-[85%] flex-col gap-1 sm:max-w-[70%] ${
                                group.isMine ? "items-end" : "items-start"
                              }`}
                            >
                              {showAvatar && (
                                <span className="px-1 text-[12px] font-bold text-[var(--color-text-brand)]">
                                  {senderName}
                                </span>
                              )}

                              {group.messages.map((msg, msgIndex) => {
                                const attachments = getMessageAttachments(msg);
                                const text = getMessageText(msg);
                                const isLastOfRun = msgIndex === group.messages.length - 1;

                                return (
                                  <div
                                    key={msg.id}
                                    className={`group/msg flex items-end gap-1.5 ${
                                      group.isMine ? "flex-row-reverse" : "flex-row"
                                    }`}
                                  >
                                    <div
                                      className={`relative px-4 py-2.5 text-[14px] leading-relaxed transition-all shadow-sm ${
                                        msg._optimistic ? "opacity-60 scale-[0.98]" : "scale-100"
                                      }`}
                                      style={{
                                        background: group.isMine
                                          ? "var(--color-bg-primary)"
                                          : "var(--color-bg-form)",
                                        color: group.isMine
                                          ? "#ffffff"
                                          : "var(--color-text-primary)",
                                        border: group.isMine
                                          ? "none"
                                          : "1px solid var(--color-border-form)",
                                        borderRadius: "20px",
                                        // Tail on the last bubble of each run.
                                        borderEndEndRadius:
                                          group.isMine && isLastOfRun ? "4px" : "20px",
                                        borderEndStartRadius:
                                          !group.isMine && isLastOfRun ? "4px" : "20px",
                                      }}
                                    >
                                      {attachments.length > 0 && (
                                        <div
                                          className={`space-y-1.5 ${text ? "mb-2" : ""}`}
                                        >
                                          {attachments.map((file) =>
                                            file.isImage ? (
                                              <a
                                                key={file.url}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block overflow-hidden rounded-xl"
                                              >
                                                <img
                                                  src={file.url}
                                                  alt={file.name}
                                                  className="max-h-60 w-full object-cover transition-transform hover:scale-[1.02]"
                                                />
                                              </a>
                                            ) : (
                                              <a
                                                key={file.url}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-opacity hover:opacity-80"
                                                style={{
                                                  background: group.isMine
                                                    ? "rgba(255,255,255,0.18)"
                                                    : "var(--color-bg)",
                                                }}
                                              >
                                                <FileText size={15} className="shrink-0" />
                                                <span className="truncate">{file.name}</span>
                                              </a>
                                            )
                                          )}
                                        </div>
                                      )}

                                      {text && (
                                        <p className="whitespace-pre-wrap break-words">{text}</p>
                                      )}
                                    </div>

                                    {/* Timestamp reveals on hover to keep the thread clean */}
                                    <span className="ds-text-gray-200 shrink-0 pb-1 text-[10px] font-medium opacity-0 transition-opacity group-hover/msg:opacity-100">
                                      {formatClock(msg.created_at, locale)}
                                    </span>
                                  </div>
                                );
                              })}

                              {/* Delivery state on the newest own message only */}
                              {group.isMine && (
                                <span className="ds-text-gray-200 flex items-center gap-1 px-1 text-[10px] font-medium">
                                  {formatClock(
                                    group.messages[group.messages.length - 1]?.created_at,
                                    locale
                                  )}
                                  {group.messages[group.messages.length - 1]?._optimistic ? (
                                    <Check size={11} />
                                  ) : (
                                    <CheckCheck size={11} className="text-[var(--color-text-brand)]" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-primary-200)] text-[var(--color-text-brand)]">
                    <MessagesSquare size={26} />
                  </div>
                  <p className="ds-text-primary text-sm font-semibold">{t("noMessages")}</p>
                  <p className="ds-text-gray-200 mt-1 max-w-xs text-xs">{t("noMessagesHint")}</p>
                </div>
              )}
            </div>

            {/* Composer */}
            <div
              className="shrink-0 px-4 py-3 md:px-6 ds-bg-form"
              style={{ borderTop: "1px solid var(--color-border-form)" }}
            >
              {pendingFiles.length > 0 && (
                <div className="mb-2.5 flex w-full flex-wrap gap-2">
                  {pendingFiles.map((file, index) => {
                    const isImage = file.type.startsWith("image/");
                    return (
                      <span
                        key={`${file.name}-${index}`}
                        className="flex max-w-[220px] items-center gap-2 rounded-lg bg-[var(--color-bg)] py-1.5 pe-1.5 ps-2.5 text-[12px] font-medium"
                        style={{ border: "1px solid var(--color-border-form)" }}
                      >
                        {isImage ? (
                          <ImageIcon size={13} className="shrink-0 text-[var(--color-text-brand)]" />
                        ) : (
                          <FileText size={13} className="shrink-0 text-[var(--color-text-brand)]" />
                        )}
                        <span className="ds-text-gray truncate">{file.name}</span>
                        <button
                          type="button"
                          aria-label={t("removeAttachment")}
                          onClick={() =>
                            setPendingFiles((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="ds-text-gray-200 flex h-4 w-4 shrink-0 items-center justify-center rounded-full hover:text-rose-500"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="flex w-full items-end gap-2">
                <div
                  className="flex flex-1 items-end gap-1 rounded-[24px] bg-[var(--color-bg)] px-3 py-2 transition-all duration-300 focus-within:border-[var(--color-border-inputs-focus)] focus-within:shadow-sm"
                  style={{ border: "1px solid var(--color-border-form)" }}
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="ds-text-gray-200 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-form)] hover:text-[var(--color-text-brand)]"
                        title={t("insertEmoji")}
                      >
                        <Smile size={19} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-64 rounded-xl p-2 ds-bg-form"
                      align="start"
                      sideOffset={12}
                      style={{ border: "1px solid var(--color-border-form)" }}
                    >
                      <div className="grid grid-cols-6 gap-1">
                        {COMMON_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setMessageBody((prev) => prev + emoji)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors hover:bg-[var(--color-bg)]"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <textarea
                    ref={composerRef}
                    rows={1}
                    value={messageBody}
                    onChange={(event) => setMessageBody(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={t("typeMessage")}
                    className="ds-text-primary max-h-[132px] flex-1 resize-none bg-transparent py-2 text-[14px] leading-relaxed outline-none placeholder:text-[var(--color-text-gray-200)]"
                  />

                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="ds-text-gray-200 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-form)] hover:text-[var(--color-text-brand)]"
                      title={t("attachImage")}
                    >
                      <ImageIcon size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="ds-text-gray-200 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-form)] hover:text-[var(--color-text-brand)]"
                      title={t("attachFile")}
                    >
                      <Paperclip size={18} />
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilesPicked}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFilesPicked}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void submitMessage()}
                  aria-label={t("send")}
                  disabled={!canSend || isSendingMessage}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-primary)] text-white transition-all duration-300 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                  style={{
                    boxShadow: canSend
                      ? "0 6px 16px 0 color-mix(in srgb, var(--color-bg-primary) 40%, transparent)"
                      : "none",
                  }}
                >
                  <Send size={20} strokeWidth={2.5} className="rtl:rotate-180" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-bg-primary-200)] text-[var(--color-text-brand)]">
              <MessagesSquare size={34} />
            </div>
            <h3 className="ds-text-primary mb-2 text-xl font-bold">{t("emptyStateTitle")}</h3>
            <p className="ds-text-gray-100 max-w-sm text-sm">{t("emptyStateHint")}</p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-5 h-10 gap-2 rounded-full bg-[var(--color-bg-primary)] px-5 font-bold text-white hover:opacity-90"
            >
              <Plus size={16} strokeWidth={2.5} />
              {t("create.title")}
            </Button>
          </div>
        )}
      </section>

      <CreateConversationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onStartChat={handleStartNewChat}
        isCreating={isCreating}
      />

      {isGroupMembersModalOpen && currentConversation && (
        <GroupMembersModal
          isOpen={isGroupMembersModalOpen}
          onClose={() => setIsGroupMembersModalOpen(false)}
          conversation={currentConversation}
        />
      )}

      {isEditGroupModalOpen && currentConversation && (
        <EditGroupModal
          isOpen={isEditGroupModalOpen}
          onClose={() => setIsEditGroupModalOpen(false)}
          conversation={currentConversation}
        />
      )}
    </div>
  );
}
