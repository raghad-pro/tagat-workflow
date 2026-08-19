"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { meetingsApi } from "../api/meetings.api";

interface JoinByCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinByCodeModal({ isOpen, onClose }: JoinByCodeModalProps) {
  const t = useTranslations("meetings");
  const router = useRouter();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    const cleanInput = code.trim();
    if (!cleanInput) {
      toast.error("يرجى إدخال كود الاجتماع أو رابط الدعوة");
      return;
    }

    setIsLoading(true);
    try {
      // Accept either a raw code, a numeric ID, or a copied room URL.
      let requestedValue = cleanInput;
      try {
        const parsed = new URL(cleanInput);
        const roomMatch = parsed.pathname.match(/\/meetings\/([^/]+)/i);
        if (roomMatch?.[1]) requestedValue = decodeURIComponent(roomMatch[1]);
      } catch {
        const roomMatch = cleanInput.match(/(?:^|\/)meetings\/([^/?#]+)/i);
        if (roomMatch?.[1]) requestedValue = decodeURIComponent(roomMatch[1]);
      }

      let meetingId = /^\d+$/.test(requestedValue) ? requestedValue : "";
      if (!meetingId) {
        const role = user?.role || "employee";
        const result = await meetingsApi.getAll(role, {
          search: requestedValue,
          page: 1,
          per_page: 25,
        });
        const normalized = requestedValue.toLowerCase();
        const meeting = result.data.find(
          (item) => item.meeting_code?.toLowerCase() === normalized
        );
        meetingId = meeting ? String(meeting.id) : "";
      }

      if (!meetingId) {
        toast.error("لم يتم العثور على اجتماع بهذا الكود");
        return;
      }

      onClose();
      setCode("");
      setPassword("");
      router.push(`/meetings/${encodeURIComponent(meetingId)}${password ? `?pwd=${encodeURIComponent(password)}` : ""}`);
    } catch (error: any) {
      toast.error(error?.message || "تعذر الوصول إلى الاجتماع");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={() => {
        setCode("");
        setPassword("");
        onClose();
      }}
      title={t("joinByCode")}
      mode="add"
      saveLabel={t("joinMeeting")}
      onSubmit={handleJoin}
      isLoading={isLoading}
      size="sm"
    >
      <div className="space-y-4 py-2">
        <div className="flex justify-center my-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Video className="w-8 h-8" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting-code">{t("meetingCode")}</Label>
          <Input
            id="meeting-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("meetingCodePlaceholder")}
            className="text-center text-lg font-mono tracking-widest uppercase"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting-pwd">{t("form.password")} (اختياري)</Label>
          <Input
            id="meeting-pwd"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("form.passwordPlaceholder")}
          />
        </div>
      </div>
    </ActionModal>
  );
}
