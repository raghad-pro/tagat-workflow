"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";
import toast from "react-hot-toast";

interface JoinByCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinByCodeModal({ isOpen, onClose }: JoinByCodeModalProps) {
  const t = useTranslations("meetings");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = () => {
    const cleanCode = code.trim();
    if (!cleanCode) {
      toast.error("يرجى إدخال كود الاجتماع");
      return;
    }

    setIsLoading(true);
    let finalIdOrCode = cleanCode;
    if (cleanCode.includes("/meetings/")) {
      finalIdOrCode = cleanCode.split("/meetings/")[1].split("?")[0].replace("/", "");
    }

    onClose();
    setIsLoading(false);
    setCode("");
    setPassword("");
    router.push(`/meetings/${encodeURIComponent(finalIdOrCode)}${password ? `?pwd=${encodeURIComponent(password)}` : ""}`);
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
