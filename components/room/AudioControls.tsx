"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Headphones, Mic, MicOff, PhoneOff } from "lucide-react";
import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { Button } from "@/components/ui/button";

type AudioControlsProps = {
  onLeave: () => Promise<void>;
};

export function AudioControls({ onLeave }: AudioControlsProps) {
  const router = useRouter();
  const call = useCall();
  const { useMicrophoneState, useSpeakerState } = useCallStateHooks();
  const { microphone, optionsAwareIsMute, isTogglePending } = useMicrophoneState();
  const { speaker, volume } = useSpeakerState();
  const [isLeaving, setIsLeaving] = useState(false);

  const isDeafened = volume === 0;

  async function handleLeave() {
    setIsLeaving(true);

    try {
      await call?.leave();
    } catch {
      // Best-effort leave. The cleanup handler also disconnects local clients.
    }

    await onLeave();
    router.push("/");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant={optionsAwareIsMute ? "secondary" : "default"}
        onClick={() => microphone.toggle()}
        disabled={isTogglePending}
      >
        {optionsAwareIsMute ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {optionsAwareIsMute ? "Unmute" : "Mute"}
      </Button>

      <Button
        variant={isDeafened ? "secondary" : "outline"}
        onClick={() => speaker.setVolume(isDeafened ? 1 : 0)}
      >
        <Headphones className="h-4 w-4" />
        {isDeafened ? "Undeafen" : "Deafen"}
      </Button>

      <Button variant="destructive" onClick={handleLeave} disabled={isLeaving}>
        <PhoneOff className="h-4 w-4" />
        {isLeaving ? "Leaving..." : "Leave room"}
      </Button>
    </div>
  );
}
