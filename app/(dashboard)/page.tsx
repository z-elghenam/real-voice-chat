import { db } from "@/lib/db";
import { CreateRoomModal } from "@/components/dashboard/CreateRoomModal";
import { RoomList } from "@/components/dashboard/RoomList";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const rooms = await db.room.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr] lg:items-end">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm text-sky-100">
            Live rooms powered by Stream audio + chat
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Drop into a voice room, talk in real time, and keep the text chat beside
            the conversation.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-300">
            Browse public rooms, create a new one with participant limits, and move
            into a responsive room interface with speaking indicators, invite links,
            and live chat.
          </p>
        </div>
        <div className="flex justify-start lg:justify-end">
          <CreateRoomModal />
        </div>
      </section>

      <section>
        <RoomList rooms={rooms} />
      </section>
    </main>
  );
}
