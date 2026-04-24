"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Room } from "@prisma/client";
import { StreamVideo, StreamCall, StreamVideoClient, CallingState, ParticipantsAudio, useCallStateHooks } from "@stream-io/video-react-sdk";
import { ArrowLeft, Copy, Radio, TriangleAlert, UsersRound } from "lucide-react";
import { StreamChat } from "stream-chat";
import type { Channel as StreamChannel } from "stream-chat";
import { AudioControls } from "@/components/room/AudioControls";
import { ChatSidebar } from "@/components/room/ChatSidebar";
import { ParticipantList, type RoomParticipant } from "@/components/room/ParticipantList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StreamTokenResponse = {
  apiKey: string;
  chatToken: string;
  user: {
    id: string;
    image?: string;
    name: string;
  };
  videoToken: string;
};

type AudioRoomProps = {
  isHost: boolean;
  room: Room;
};

async function getStreamTokens(roomId: string) {
  const response = await fetch(`/api/stream/token?roomId=${encodeURIComponent(roomId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(payload?.error || "Unable to authenticate with Stream.");
  }

  return (await response.json()) as StreamTokenResponse;
}

export function AudioRoom({ room, isHost }: AudioRoomProps) {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<ReturnType<StreamVideoClient["call"]> | null>(null);
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [viewer, setViewer] = useState<StreamTokenResponse["user"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const clientsRef = useRef<{
    call: ReturnType<StreamVideoClient["call"]> | null;
    chatClient: StreamChat | null;
    videoClient: StreamVideoClient | null;
  }>({
    call: null,
    chatClient: null,
    videoClient: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        setIsLoading(true);
        setError(null);

        const tokenPayload = await getStreamTokens(room.id);
        if (cancelled) return;

        const tokenProvider = async () => {
          const refreshed = await getStreamTokens(room.id);
          return refreshed.videoToken;
        };

        const nextVideoClient = new StreamVideoClient({
          apiKey: tokenPayload.apiKey,
          tokenProvider,
          user: tokenPayload.user,
        });

        const nextCall = nextVideoClient.call(
          process.env.NEXT_PUBLIC_STREAM_CALL_TYPE || "audio_room",
          room.id,
        );

        await nextCall.getOrCreate({
          data: {
            custom: {
              roomDescription: room.description,
              roomName: room.name,
            },
          },
        });

        if (
          isHost &&
          (process.env.NEXT_PUBLIC_STREAM_CALL_TYPE || "audio_room") === "audio_room"
        ) {
          try {
            await nextCall.goLive();
          } catch {
            // The room may already be live, which is fine for re-joins.
          }
        }

        await nextCall.join();
        await nextCall.camera.disable().catch(() => undefined);

        const nextChatClient = StreamChat.getInstance(tokenPayload.apiKey);
        await nextChatClient.connectUser(tokenPayload.user, tokenPayload.chatToken);

        const nextChannel = nextChatClient.channel("messaging", room.id);

        await nextChannel.watch();

        if (cancelled) {
          await Promise.allSettled([
            nextCall.leave(),
            nextVideoClient.disconnectUser(),
            nextChatClient.disconnectUser(),
          ]);
          return;
        }

        clientsRef.current = {
          call: nextCall,
          chatClient: nextChatClient,
          videoClient: nextVideoClient,
        };

        setViewer(tokenPayload.user);
        setVideoClient(nextVideoClient);
        setCall(nextCall);
        setChatClient(nextChatClient);
        setChannel(nextChannel);
      } catch (setupError) {
        setError(
          setupError instanceof Error
            ? setupError.message
            : "Unable to join the room.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    setup();

    return () => {
      cancelled = true;

      const current = clientsRef.current;
      void Promise.allSettled([
        current.call?.leave(),
        current.videoClient?.disconnectUser(),
        current.chatClient?.disconnectUser(),
      ]);
    };
  }, [isHost, room.description, room.id, room.name]);

  async function disconnect() {
    const current = clientsRef.current;
    await Promise.allSettled([
      current.call?.leave(),
      current.videoClient?.disconnectUser(),
      current.chatClient?.disconnectUser(),
    ]);
  }

  if (isLoading) {
    return (
      <div className="mx-auto grid min-h-[80vh] w-full max-w-7xl place-items-center">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="text-white">Joining {room.name}</CardTitle>
            <CardDescription>
              Preparing your Stream voice session and room chat.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !videoClient || !call || !chatClient || !channel || !viewer) {
    return (
      <div className="mx-auto grid min-h-[80vh] w-full max-w-3xl place-items-center">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-3 text-amber-300">
              <TriangleAlert className="h-5 w-5" />
              Room unavailable
            </div>
            <CardTitle className="text-white">We could not finish the room setup</CardTitle>
            <CardDescription>
              {error ||
                "The room client could not initialize. Double-check your Clerk and Stream environment variables."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        <RoomExperience
          channel={channel}
          chatClient={chatClient}
          isHost={isHost}
          onLeave={disconnect}
          room={room}
          viewer={viewer}
        />
      </StreamCall>
    </StreamVideo>
  );
}

type RoomExperienceProps = {
  channel: StreamChannel;
  chatClient: StreamChat;
  isHost: boolean;
  onLeave: () => Promise<void>;
  room: Room;
  viewer: StreamTokenResponse["user"];
};

function RoomExperience({
  channel,
  chatClient,
  isHost,
  onLeave,
  room,
  viewer,
}: RoomExperienceProps) {
  const { useCallCallingState, useParticipantCount, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const participants = useParticipants();
  const [inviteCopied, setInviteCopied] = useState(false);
  const [notices, setNotices] = useState<Array<{ id: string; message: string }>>([]);
  const previousParticipants = useRef<Map<string, RoomParticipant>>(new Map());
  const visibleParticipants = useMemo(
    () =>
      (participants as unknown as RoomParticipant[]).slice(0, room.maxParticipants),
    [participants, room.maxParticipants],
  );

  const pushNotice = useEffectEvent((message: string) => {
    setNotices((current) =>
      [{ id: crypto.randomUUID(), message }, ...current].slice(0, 6),
    );
  });

  useEffect(() => {
    const previous = previousParticipants.current;
    const next = new Map(
      visibleParticipants.map((participant) => [participant.sessionId, participant]),
    );

    if (previous.size > 0) {
      for (const [sessionId, participant] of next) {
        if (!previous.has(sessionId) && participant.userId !== viewer.id) {
          pushNotice(
            `${participant.name || participant.userId || "A participant"} joined the voice room.`,
          );
        }
      }

      for (const [sessionId, participant] of previous) {
        if (!next.has(sessionId) && participant.userId !== viewer.id) {
          pushNotice(
            `${participant.name || participant.userId || "A participant"} left the voice room.`,
          );
        }
      }
    }

    previousParticipants.current = next;
  }, [viewer.id, visibleParticipants]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetch(`/api/rooms/${room.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantsCount: participantCount,
        }),
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [participantCount, room.id]);

  async function handleCopyInvite() {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${room.id}`);
    setInviteCopied(true);
    window.setTimeout(() => setInviteCopied(false), 1600);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to rooms
          </Link>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <Radio className="h-3.5 w-3.5" />
              {isHost ? "Hosting now" : "Listening now"}
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{room.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              {room.description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <UsersRound className="h-4 w-4 text-sky-300" />
            {participantCount} / {room.maxParticipants} active
          </div>
          <Button variant="secondary" onClick={handleCopyInvite}>
            <Copy className="h-4 w-4" />
            {inviteCopied ? "Copied" : "Copy invite"}
          </Button>
        </div>
      </div>

      {callingState !== CallingState.JOINED ? (
        <div className="rounded-[28px] border border-sky-300/20 bg-sky-400/10 px-5 py-4 text-sm text-sky-100">
          Voice transport state: <span className="font-semibold">{callingState}</span>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.96))] p-6 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Audio room
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  Low-latency voice with Stream SFU
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                  Microphone control, output mute, live participant updates, and room
                  chat are all attached to the same room id.
                </p>
              </div>
              <AudioControls onLeave={onLeave} />
            </div>
          </div>

          <ParticipantList participants={visibleParticipants} />

          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20">
            <h2 className="text-lg font-semibold text-white">Room activity</h2>
            <p className="mt-1 text-sm text-slate-400">
              Join and leave events inferred from live participant updates.
            </p>
            <div className="mt-4 space-y-3">
              {notices.length > 0 ? (
                notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200"
                  >
                    {notice.message}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
                  Join and leave notices will appear here as participants move through the
                  room.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-[40rem]">
          <ChatSidebar channel={channel} client={chatClient} roomName={room.name} />
        </div>
      </div>

      <ParticipantsAudio participants={participants} />
    </div>
  );
}
