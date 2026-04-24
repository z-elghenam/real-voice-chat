import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getStreamApiKey,
  getStreamChatServerClient,
  getStreamVideoServerClient,
  isStreamConfigured,
  upsertStreamUser,
} from "@/lib/stream";

export const dynamic = "force-dynamic";

function getDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) {
    return "Guest";
  }

  return (
    user.fullName ||
    user.username ||
    user.firstName ||
    user.primaryEmailAddress?.emailAddress ||
    "Guest"
  );
}

function isAlreadyMemberError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /already (a )?member/i.test(error.message);
}

export async function GET(request: Request) {
  const { userId } = await auth();
  const { searchParams } = new URL(request.url);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStreamConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stream credentials are missing. Set NEXT_PUBLIC_STREAM_API_KEY and STREAM_API_SECRET.",
      },
      { status: 500 },
    );
  }

  const user = await currentUser();
  const streamUser = {
    id: userId,
    name: getDisplayName(user),
    image: user?.imageUrl,
  };

  await upsertStreamUser(streamUser);

  const roomId = searchParams.get("roomId");
  if (roomId) {
    const room = await db.room.findUnique({
      where: {
        id: roomId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    const chatClient = getStreamChatServerClient();
    const existingChannels = await chatClient.queryChannels(
      {
        id: {
          $eq: room.id,
        },
        type: "messaging",
      },
      { created_at: -1 },
      {
        limit: 1,
        state: false,
        watch: false,
      },
    );

    if (existingChannels.length === 0) {
      const roomChannel = chatClient.channel("messaging", room.id, {
        created_by_id: streamUser.id,
        members: [streamUser.id],
        name: room.name,
      });

      await roomChannel.create();
    } else {
      try {
        await existingChannels[0].addMembers([streamUser.id]);
      } catch (error) {
        if (!isAlreadyMemberError(error)) {
          throw error;
        }
      }
    }
  }

  const [videoToken, chatToken] = await Promise.all([
    Promise.resolve(
      getStreamVideoServerClient().generateUserToken({
        user_id: streamUser.id,
        validity_in_seconds: 60 * 60,
      }),
    ),
    Promise.resolve(getStreamChatServerClient().createToken(streamUser.id)),
  ]);

  return NextResponse.json({
    apiKey: getStreamApiKey(),
    videoToken,
    chatToken,
    user: streamUser,
  });
}
