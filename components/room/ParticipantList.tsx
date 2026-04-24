"use client";

import { Mic, MicOff, Volume2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type RoomParticipant = {
  image?: string;
  isLocalParticipant?: boolean;
  isSpeaking?: boolean;
  name?: string;
  publishedTracks?: unknown[];
  sessionId: string;
  userId?: string;
};

type ParticipantListProps = {
  participants: RoomParticipant[];
};

function getInitials(name?: string, userId?: string) {
  const source = name || userId || "VC";
  return source
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Participants</h2>
          <p className="text-sm text-slate-400">
            Live updates from the active Stream call.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
          {participants.length}
        </div>
      </div>

      <div className="space-y-3">
        {participants.map((participant) => {
          const audioEnabled = Boolean(
            participant.publishedTracks?.some((track) =>
              typeof track === "string"
                ? track === "audio"
                : typeof track === "object" &&
                    track !== null &&
                    "toString" in track &&
                    String(track).includes("audio"),
            ),
          );

          return (
            <div
              key={participant.sessionId}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-3 transition-colors",
                participant.isSpeaking && "border-emerald-400/30 bg-emerald-400/10",
              )}
            >
              <Avatar className="h-11 w-11 border border-white/10">
                <AvatarImage
                  src={participant.image}
                  alt={participant.name || participant.userId || "Participant"}
                />
                <AvatarFallback>
                  {getInitials(participant.name, participant.userId)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-white">
                  {participant.name || participant.userId || "Anonymous listener"}
                </div>
                <div className="text-xs text-slate-400">
                  {participant.isLocalParticipant
                    ? "You"
                    : participant.isSpeaking
                      ? "Speaking now"
                      : "Listening"}
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                {audioEnabled ? (
                  <Mic className="h-4 w-4 text-emerald-300" />
                ) : (
                  <MicOff className="h-4 w-4 text-slate-500" />
                )}
                {participant.isSpeaking ? (
                  <Volume2 className="h-4 w-4 text-emerald-300" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
