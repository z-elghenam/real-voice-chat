import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
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

export async function GET() {
  const { userId } = await auth();

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
