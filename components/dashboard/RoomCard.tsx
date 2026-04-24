import Link from "next/link";
import type { Room } from "@prisma/client";
import { ArrowUpRight, Radio, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils";

type RoomCardProps = {
  room: Room;
};

export function RoomCard({ room }: RoomCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <Radio className="h-3.5 w-3.5" />
              Public voice room
            </div>
            <CardTitle className="text-white">{room.name}</CardTitle>
            <CardDescription>{room.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <UsersRound className="h-4 w-4" />
              Online
            </div>
            <div className="text-lg font-semibold text-white">
              {room.participantsCount} / {room.maxParticipants}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <div className="mb-2 text-slate-400">Created</div>
            <div className="text-sm font-medium text-white">
              {formatRelativeDate(room.createdAt)}
            </div>
          </div>
        </div>

        <Button asChild className="w-full">
          <Link href={`/room/${room.id}`}>
            Join room
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
