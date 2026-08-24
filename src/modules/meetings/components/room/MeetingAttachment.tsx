"use client";

import React, { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";

import { cn } from "@/lib/utils";
import { meetingsApi } from "../../api/meetings.api";
import type { MeetingAttachment as Attachment } from "../../types/meetings.types";

/**
 * Resolves an attachment id to a URL the browser can actually render.
 *
 * `/meeting-attachments/{id}/download` requires the bearer token, which an
 * `<img>` or `<a download>` never sends — pointing either straight at the route
 * yields a broken image and a redirect to the web login. Fetching through the
 * API client and wrapping the bytes in an object URL is what makes both work.
 *
 * Optimistic messages already hold a local blob URL; those are used as-is so a
 * just-sent file shows instantly instead of waiting for a round trip.
 */
function useAttachmentUrl(role: string, attachment: Attachment) {
  const local = attachment.file_url || attachment.download_url || null;
  const [url, setUrl] = useState<string | null>(local);

  useEffect(() => {
    if (local) {
      setUrl(local);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const blob = await meetingsApi.downloadAttachment(role, attachment.id);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        // A missing attachment degrades to a plain filename, never a crash.
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [role, attachment.id, local]);

  return url;
}

function isImageAttachment(attachment: Attachment) {
  return (
    attachment.type === "image" ||
    (attachment.mime_type ?? attachment.file_type ?? "").startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(attachment.file_name ?? "")
  );
}

interface MeetingAttachmentProps {
  attachment: Attachment;
  role: string;
  /** Styles the file chip against the sender's own bubble colour. */
  isMine: boolean;
}

export default function MeetingAttachment({
  attachment,
  role,
  isMine,
}: MeetingAttachmentProps) {
  const url = useAttachmentUrl(role, attachment);
  const isImage = isImageAttachment(attachment);

  const chipClass = cn(
    "flex items-center gap-2 p-2 rounded-[8px] border text-xs transition-colors",
    isMine
      ? "bg-white/10 border-white/20 hover:bg-white/20"
      : "bg-[#111827] border-[#2A3756] hover:border-[#25C6DA]"
  );

  // Still fetching, or the fetch failed: show the name rather than a broken
  // image or a link that goes nowhere.
  if (!url) {
    return (
      <div className={cn(chipClass, "opacity-60")}>
        <FileText className="w-4 h-4" />
        <span className="truncate flex-1">{attachment.file_name}</span>
      </div>
    );
  }

  if (isImage) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-[8px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- object URL, not an optimisable asset */}
        <img
          src={url}
          alt={attachment.file_name}
          className="max-h-48 w-full object-cover"
        />
      </a>
    );
  }

  return (
    <a href={url} download={attachment.file_name} className={chipClass}>
      <FileText className="w-4 h-4" />
      <span className="truncate flex-1">{attachment.file_name}</span>
      <Download className="w-3.5 h-3.5 opacity-80" />
    </a>
  );
}
