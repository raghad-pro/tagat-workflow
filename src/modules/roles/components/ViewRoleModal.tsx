"use client";

import React from "react";
import { Text } from "@/components/atoms/Text";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import type { Role } from "../types/roles.types";
import { Shield } from "lucide-react";

export function ViewRoleModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Role | null }) {
  if (!data) return null;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title="Role Details"
      headerIcon={<Shield size={24} />}
      headerTitle={data.name}
      headerSubtitle={
        <span className={"px-2 py-0.5 rounded text-xs inline-block " + (data.type === 'system' ? 'bg-primary/10 text-[var(--color-primary)]' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400')}>
          {data.type}
        </span>
      }
    >
      <InfoRow label="Description">
        <Text size="sm" tag="span">{data.description}</Text>
      </InfoRow>

      <InfoRow label="Users Count">
        <Text size="sm" tag="span">{data.usersCount}</Text>
      </InfoRow>

      <InfoRow label="Created At">
        <Text size="sm" tag="span">{data.createdAt}</Text>
      </InfoRow>
    </ViewDetailsLayout>
  );
}
