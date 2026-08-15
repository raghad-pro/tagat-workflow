"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Edit2, Trash2, BookOpen, Share2, Lock, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ActionModal } from "@/components/molecules/ActionModal";
import {
  useMeetingNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "../../hooks/useMeetings";
import type { MeetingNote, CreateNotePayload, NoteStatus } from "../../types/meetings.types";
import toast from "react-hot-toast";

interface MeetingNotesProps {
  meetingId: number | string;
}

export default function MeetingNotes({ meetingId }: MeetingNotesProps) {
  const t = useTranslations("meetings");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<MeetingNote | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<NoteStatus>("published");
  const [isShared, setIsShared] = useState(true);

  const { data: notes = [], isLoading } = useMeetingNotes(meetingId);
  const { mutate: createNote, isPending: isCreating } = useCreateNote();
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();

  const handleOpenCreate = () => {
    setTitle("");
    setContent("");
    setStatus("published");
    setIsShared(true);
    setEditingNote(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (note: MeetingNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setStatus(note.status || "published");
    setIsShared(note.is_shared ?? true);
    setIsCreateOpen(true);
  };

  const handleSubmit = () => {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanTitle || !cleanContent) {
      toast.error("يرجى إدخال عنوان ومحتوى الملاحظة");
      return;
    }

    if (editingNote) {
      updateNote(
        {
          noteId: editingNote.id,
          meetingId,
          payload: {
            title: cleanTitle,
            content: cleanContent,
            status,
            is_shared: isShared,
          },
        },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
            setEditingNote(null);
          },
        }
      );
    } else {
      createNote(
        {
          meetingId,
          payload: {
            title: cleanTitle,
            content: cleanContent,
            status,
            is_shared: isShared,
          },
        },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
          },
        }
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b bg-muted/20 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span>{t("roomTabs.notes")}</span>
        </h3>

        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="h-8 gap-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t("notes.createNote")}</span>
        </Button>
      </div>

      {/* Notes List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
            <BookOpen className="w-10 h-10 stroke-1 mb-2 opacity-60" />
            <p className="text-sm font-medium">لا توجد ملاحظات أو محاضر حتى الآن</p>
            <p className="text-xs mt-1">سجل النقاط الرئيسية ومحضر الاجتماع لتوثيق المناقشات.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-4 bg-muted/30 border rounded-xl space-y-2.5 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-foreground">{note.title}</h4>
                  <Badge
                    variant={note.status === "published" ? "default" : "secondary"}
                    className="text-[10px] py-0"
                  >
                    {note.status === "published" ? t("notes.statusPublished") : t("notes.statusDraft")}
                  </Badge>
                  {note.is_shared ? (
                    <Badge variant="outline" className="text-[10px] py-0 gap-1 text-sky-600 border-sky-500/30">
                      <Share2 className="w-2.5 h-2.5" />
                      <span>{t("notes.isShared")}</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] py-0 gap-1 text-muted-foreground">
                      <Lock className="w-2.5 h-2.5" />
                      <span>{t("notes.private")}</span>
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(note)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNote({ noteId: note.id, meetingId })}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>

              {note.creator && (
                <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>كتب بواسطة: {note.creator.name}</span>
                  {note.created_at && (
                    <span>
                      {new Date(note.created_at).toLocaleDateString("ar-EG")}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Note Modal */}
      <ActionModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingNote(null);
        }}
        title={editingNote ? "تعديل الملاحظة" : t("notes.createNote")}
        mode={editingNote ? "edit" : "add"}
        saveLabel={t("common.save")}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
        size="lg"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{t("notes.title")}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("notes.titlePlaceholder")}
              className="text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{t("notes.content")}</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("notes.contentPlaceholder")}
              rows={6}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={status === "published"}
                onChange={(e) => setStatus(e.target.checked ? "published" : "draft")}
                className="rounded text-primary"
              />
              <span>نشر الملاحظة مباشرة</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="rounded text-primary"
              />
              <span>{t("notes.isShared")}</span>
            </label>
          </div>
        </div>
      </ActionModal>
    </div>
  );
}
