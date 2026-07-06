"use client";

import React from "react";
import { Text } from "@/components/atoms/Text";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import type { Contract } from "../types/contracts.types";
import { FileText } from "lucide-react";

export function ViewContractModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Contract | null }) {
  if (!data) return null;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title="Contract Details"
      headerIcon={<FileText size={24} />}
      headerTitle={data.customerName}
      headerSubtitle={data.title}
    >
      <InfoRow label="Company">
        <Text size="sm" tag="span">{data.company}</Text>
      </InfoRow>

      <InfoRow label="Project">
        <Text size="sm" tag="span">{data.project}</Text>
      </InfoRow>

      <InfoRow label="Initial Value">
        <Text size="sm" tag="span">{data.initial}</Text>
      </InfoRow>
    </ViewDetailsLayout>
  );
}
