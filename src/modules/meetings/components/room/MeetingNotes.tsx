"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import {
  useMeetingNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "../../hooks/useMeetings";
import type { MeetingNote, CreateNotePayload, UpdateNotePayload } from "../../types/meetings.types";

interface MeetingNotesProps {
  meetingId: number | string;
}

export default function MeetingNotes({ meetingId }: MeetingNotesProps) {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<MeetingNote | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isShared, setIsShared] = useState(true);

  const { data: notes = [], isLoading } = useMeetingNotes(meetingId);
  const { mutate: createNote, isPending: isCreating } = useCreateNote();
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
  const { mutate: deleteNote } = useDeleteNote();

  const handleOpenCreate = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setIsShared(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (note: MeetingNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsShared(note.is_shared);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingNote(null);
    setTitle("");
    setContent("");
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    if (editingNote) {
      const payload: UpdateNotePayload = {
        title: title.trim(),
        content: content.trim(),
        is_shared: isShared,
      };
      updateNote(
        { noteId: editingNote.id, payload, meetingId },
        { onSuccess: handleCancel }
      );
    } else {
      const payload: CreateNotePayload = {
        title: title.trim(),
        content: content.trim(),
        is_shared: isShared,
      };
      createNote(
        { meetingId, payload },
        { onSuccess: handleCancel }
      );
    }
  };

  return (
    <div className="flex flex-col h-full rounded-[14px] bg-[#111827] border border-[#1F2937] overflow-hidden text-white">
      {/* ── Top Header matching Figma (notes) ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] bg-[#111827]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#25C6DA]" />
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#64748B]">
            notes ({notes.length})
          </span>
        </div>

        {!isFormOpen && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white text-[12px] font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New note</span>
          </button>
        )}
      </div>

      {/* ── Main Container ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* In-line Create / Edit Form matching Figma exactly */}
        {isFormOpen && (
          <div className="p-3.5 rounded-[14px] bg-[#1A2236] border border-[#2A3756] space-y-3 animate-in fade-in-50">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#94A3B8]">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full h-[37px] px-3 rounded-[10px] bg-[#111827] border border-[#2A3756] text-white text-[14px] placeholder:text-[#475569] focus:outline-none focus:border-[#25C6DA]"
                autoFocus
              />
            </div>

            {/* Note Textarea */}
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#94A3B8]">Note</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write note contents..."
                rows={4}
                className="w-full p-3 rounded-[10px] bg-[#111827] border border-[#2A3756] text-white text-[14px] placeholder:text-[#475569] focus:outline-none focus:border-[#25C6DA] resize-none"
              />
            </div>

            {/* Checkboxes from Figma */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[12px] font-medium text-[#94A3B8]">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-600 text-[#25C6DA] focus:ring-[#25C6DA] bg-[#111827]"
                />
                <span>Shared with meeting</span>
              </label>
            </div>

            {/* Info hint text from Figma */}
            <p className="text-[10px] text-[#64748B] leading-tight pt-1">
              Others see a note only when it is shared with the meeting room.
            </p>

            {/* Action buttons from Figma */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isCreating || isUpdating || !title.trim() || !content.trim()}
                className="px-4 py-1.5 h-[28px] rounded-[10px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white text-[12px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isCreating || isUpdating ? "Saving..." : "Save note"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 h-[28px] text-[12px] font-medium text-[#64748B] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing Notes List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 && !isFormOpen ? (
          <div className="text-center py-10 text-xs text-[#64748B]">
            No notes added yet. Click &quot;New note&quot; to begin.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3.5 rounded-[12px] bg-[#1A2236] border border-[#2A3756] space-y-2 hover:border-[#25C6DA]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-[14px] font-bold text-white leading-tight">
                  {note.title}
                </h4>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(note)}
                    className="p-1 rounded text-[#94A3B8] hover:text-[#25C6DA]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteNote({ noteId: note.id, meetingId })}
                    className="p-1 rounded text-[#94A3B8] hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-[13px] text-[#CBD5E1] whitespace-pre-wrap">
                {note.content}
              </p>

              <div className="flex items-center gap-2 pt-1 border-t border-[#2A3756]/60 text-[10px] text-[#64748B]">
                <span>{note.is_shared ? "Shared" : "Private"}</span>
                {note.creator && (
                  <>
                    <span>•</span>
                    <span>By {note.creator.name}</span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
