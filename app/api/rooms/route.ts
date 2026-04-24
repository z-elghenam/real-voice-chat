import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createRoomSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const rooms = await db.room.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createRoomSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error:
          firstIssue?.message ||
          "Please provide a valid room name, description, and participant limit.",
      },
      { status: 400 },
    );
  }

  const room = await db.room.create({
    data: {
      ...parsed.data,
      createdBy: userId,
    },
  });

  return NextResponse.json({ room }, { status: 201 });
}
