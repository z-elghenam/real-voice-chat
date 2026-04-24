import type { Room } from "@prisma/client";
import { Headphones, Waves } from "lucide-react";
import { RoomCard } from "@/components/dashboard/RoomCard";

type RoomListProps = {
  rooms: Room[];
};

export function RoomList({ rooms }: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="rounded-[32px] border border-dashed border-white/15 bg-white/5 p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-slate-950/80">
          <Headphones className="h-7 w-7 text-sky-300" />
        </div>
        <h3 className="text-xl font-semibold text-white">No rooms live yet</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
          Create the first room to start voice conversations, collaborate in real time,
          and keep the chat attached to the same space.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
      <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.98))] p-6 text-white">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100">
          <Waves className="h-3.5 w-3.5" />
          Production baseline
        </div>
        <h3 className="text-2xl font-semibold">Audio rooms, chat, and auth in one flow</h3>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Rooms are backed by Prisma, protected with Clerk, and joined through Stream
          for low-latency voice plus real-time messaging.
        </p>
      </div>
    </div>
  );
}
