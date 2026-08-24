"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MeetingDetailsPreJoin } from "./MeetingDetailsPreJoin";

interface MeetingDetailsContainerProps {
  meetingId: string | number;
}

export function MeetingDetailsContainer({ meetingId }: MeetingDetailsContainerProps) {
  const router = useRouter();

  return (
    <MeetingDetailsPreJoin
      meetingId={meetingId}
      // The room is its own route so a refresh keeps the user inside it; the
      // device-setup screen there also collects the password when needed.
      onJoin={() => router.push(`/meetings/${meetingId}/room`)}
    />
  );
}
