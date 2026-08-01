"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";

import { useConversations } from "../hooks/useConversations";
import type { Conversation } from "../types/conversations.types";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
}

const MAX_IMAGE_MB = 5;

export default function EditGroupModal({ isOpen, onClose, conversation }: EditGroupModalProps) {
  const [mounted, setMounted] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPicture, setGroupPicture] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const role = user?.role || "company";
  const t = useTranslations("conversations");

  const { updateConversation, isUpdating } = useConversations(role);

  useEffect(() => setMounted(true), []);

  // Re-seed the form from the server value each time the modal opens, keyed on
  // the conversation id rather than the object identity.
  useEffect(() => {
    if (!isOpen) return;
    setGroupName(conversation?.title || conversation?.name || "");
    setGroupPicture(null);
  }, [isOpen, conversation?.id, conversation?.title, conversation?.name]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(t("fileTooLarge", { name: file.name, size: MAX_IMAGE_MB }));
      event.target.value = "";
      return;
    }
    setGroupPicture(file);
  };

  const handleSave = async () => {
    const title = groupName.trim();
    if (!title || !conversation?.id) return;

    try {
      const result = await updateConversation({
        id: conversation.id,
        data: { title, image: groupPicture },
      });

      if (result.imageRejected) {
        toast(t("editModal.imageUnsupported"), { icon: "⚠️" });
      } else {
        toast.success(t("editModal.saved"));
      }
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ??
        (err as { message?: string })?.message ??
        t("editModal.saveFailed");
      toast.error(message);
    }
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
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl ds-bg-form shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex flex-col gap-1 ds-bg-form px-6 py-6 sm:px-8">
          <div className="mb-2 flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full ds-text-gray transition-colors hover:bg-[var(--color-bg)] rtl:rotate-180"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <h2 className="text-xl font-bold ds-text-primary sm:text-2xl">{t("editModal.title")}</h2>
          </div>
          <p className="ps-12 text-sm font-medium ds-text-gray-100">{t("editModal.subtitle")}</p>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-6 pt-4 sm:p-8 sm:pt-4">
          <div className="space-y-6 rounded-xl bg-[var(--color-bg)] p-6">
            <div>
              <label className="mb-3 block text-sm font-bold ds-text-primary">
                {t("create.groupName")}
              </label>
              <Input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder={t("create.groupNamePlaceholder")}
                className="h-11 w-full border-[var(--color-border-inputs)] ds-bg-form shadow-sm"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold ds-text-primary">
                {t("create.groupPicture")}
              </label>
              <div className="flex items-center gap-4 rounded-lg border border-[var(--color-border-inputs)] ds-bg-form p-1.5 shadow-sm">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 shrink-0 border-[var(--color-border-inputs)] bg-[var(--color-bg)] px-6 font-medium ds-text-gray"
                >
                  {t("create.chooseFile")}
                </Button>
                <span className="min-w-0 flex-1 truncate text-sm ds-text-gray-200">
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
          </div>
        </div>

        <div className="flex items-center gap-3 ds-bg-form px-6 py-6 sm:px-8">
          <Button
            onClick={handleSave}
            disabled={!groupName.trim() || isUpdating}
            className="flex h-11 items-center gap-2 rounded-lg bg-[var(--color-bg-primary)] px-8 font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {t("editModal.saveChanges")}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11 rounded-lg border-[var(--color-border-inputs)] bg-[var(--color-bg)] px-8 font-bold ds-text-gray hover:bg-[var(--color-bg)]"
          >
            {t("editModal.cancel")}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
