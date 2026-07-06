"use client";

import React from "react";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import type { Development } from "../types/developments.types";
import { Code2 } from "lucide-react";

export function ViewDevelopmentModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Development | null }) {
  if (!data) return null;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title="Development Details"
      headerIcon={<Code2 size={24} />}
      headerTitle={data.title}
      headerSubtitle={<StatusBadge status={data.status} />}
    >
      <InfoRow label="Project">
        <Text size="sm" tag="span">
          {typeof data.project === "object" && data.project !== null
            ? (data.project as any).title || (data.project as any).name
            : data.project || data.project_id}
        </Text>
      </InfoRow>

      <InfoRow label="Client">
        <Text size="sm" tag="span">
          {typeof data.client === "object" && data.client !== null
            ? (data.client as any).name
            : data.client || data.client_id}
        </Text>
      </InfoRow>

      <InfoRow label="Currency">
        <Text size="sm" tag="span">
          {typeof (data as any).currency === "object" && (data as any).currency !== null
            ? (data as any).currency.name || (data as any).currency.code
            : (data as any).currency || data.currency_id}
        </Text>
      </InfoRow>

      <InfoRow label="Description">
        <Text size="sm" tag="span">{data.description}</Text>
      </InfoRow>

      <InfoRow label="Cost">
        <Text size="sm" tag="span">{data.cost}</Text>
      </InfoRow>
    </ViewDetailsLayout>
  );
}
