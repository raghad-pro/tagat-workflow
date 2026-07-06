"use client";

import React from "react";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import type { Project } from "../types/projects.types";
import { Briefcase } from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";

export function ViewProjectModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Project | null }) {
  const { user } = useAuth();
  const isClient = user?.role === "client";

  if (!data) return null;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title="Project Details"
      headerIcon={<Briefcase size={24} />}
      headerTitle={data.title}
      headerSubtitle={typeof data.client === 'object' ? (data.client as any)?.name : data.client}
    >
      <InfoRow label="Company">
        <Text size="sm" tag="span">
          {typeof data.company === 'object' ? (data.company as any)?.name : data.company}
        </Text>
      </InfoRow>
      
      {!isClient && (
        <>
          <InfoRow label="Budget">
            <Text size="sm" tag="span">{data.budget}</Text>
          </InfoRow>

          <InfoRow label="Employees">
            <Text size="sm" tag="span">{data.employees}</Text>
          </InfoRow>
        </>
      )}

      <InfoRow label="Status">
        {data.status ? (
          <StatusBadge status={data.status as any} />
        ) : (
          <span className="ds-text-main">-</span>
        )}
      </InfoRow>
    </ViewDetailsLayout>
  );
}
