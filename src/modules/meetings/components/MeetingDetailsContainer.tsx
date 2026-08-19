"use client";

import React, { useState } from "react";
import { MeetingDetailsPreJoin } from "./MeetingDetailsPreJoin";
import { MeetingRoomPage } from "./room/MeetingRoomPage";

interface MeetingDetailsContainerProps {
  meetingId: string | number;
}

export function MeetingDetailsContainer({ meetingId }: MeetingDetailsContainerProps) {
  const [hasEnteredRoom, setHasEnteredRoom] = useState(false);

  if (hasEnteredRoom) {
    return <MeetingRoomPage meetingId={meetingId} />;
  }

  return (
    <MeetingDetailsPreJoin
      meetingId={meetingId}
      onJoin={() => setHasEnteredRoom(true)}
    />
  );
}
