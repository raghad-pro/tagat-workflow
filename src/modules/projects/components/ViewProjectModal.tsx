"use client";

import React from "react";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import type { Project } from "../types/projects.types";
import { Briefcase } from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";
import { useTranslations } from "next-intl";

export function ViewProjectModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Project | null }) {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const t = useTranslations("project");

  if (!data) return null;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title={t("viewProjectTitle")}
      headerIcon={<Briefcase size={24} />}
      headerTitle={data.title}
      headerSubtitle={typeof data.client === 'object' ? (data.client as any)?.name : data.client}
    >
      <InfoRow label={t("labels.company")}>
        <Text size="sm" tag="span">
          {typeof data.company === 'object' ? (data.company as any)?.name : data.company}
        </Text>
      </InfoRow>
      
      {!isClient && (
        <>
          <InfoRow label={t("labels.budget")}>
            <Text size="sm" tag="span">{data.budget}</Text>
          </InfoRow>

          <InfoRow label={t("labels.employees")}>
            <Text size="sm" tag="span">{data.employees}</Text>
          </InfoRow>
        </>
      )}

      <InfoRow label={t("labels.status")}>
        {data.status ? (
          <StatusBadge status={data.status as any} />
        ) : (
          <span className="ds-text-main">-</span>
        )}
      </InfoRow>
    </ViewDetailsLayout>
  );
}
