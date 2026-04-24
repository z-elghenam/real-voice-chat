import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patchParticipantsSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/rooms/[roomId]">,
) {
  const { roomId } = await context.params;

  const room = await db.room.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ room });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/rooms/[roomId]">,
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchParticipantsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid participant count payload." },
      { status: 400 },
    );
  }

  const room = await db.room.update({
    where: {
      id: roomId,
    },
    data: {
      participantsCount: parsed.data.participantsCount,
    },
  });

  return NextResponse.json({ room });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/rooms/[roomId]">,
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await context.params;
  const room = await db.room.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.createdBy !== userId) {
    return NextResponse.json(
      { error: "Only the room creator can delete this room." },
      { status: 403 },
    );
  }

  await db.room.delete({
    where: {
      id: roomId,
    },
  });

  return NextResponse.json({ ok: true });
}
