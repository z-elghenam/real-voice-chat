import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AudioRoom } from "@/components/room/AudioRoom";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const [{ roomId }, { userId }] = await Promise.all([params, auth()]);
  const room = await db.room.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_24%),linear-gradient(180deg,#020617,#0f172a)] px-4 py-6 sm:px-6 lg:px-8">
      <AudioRoom room={room} isHost={room.createdBy === userId} />
    </main>
  );
}
