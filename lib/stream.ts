import { StreamClient } from "@stream-io/node-sdk";
import { StreamChat } from "stream-chat";

export type StreamUserPayload = {
  id: string;
  name: string;
  image?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function isStreamConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_STREAM_API_KEY && process.env.STREAM_API_SECRET,
  );
}

export function getStreamApiKey() {
  return getRequiredEnv("NEXT_PUBLIC_STREAM_API_KEY");
}

export function getStreamCallType() {
  return process.env.NEXT_PUBLIC_STREAM_CALL_TYPE || "audio_room";
}

export function getStreamVideoServerClient() {
  return new StreamClient(
    getRequiredEnv("NEXT_PUBLIC_STREAM_API_KEY"),
    getRequiredEnv("STREAM_API_SECRET"),
  );
}

export function getStreamChatServerClient() {
  return StreamChat.getInstance(
    getRequiredEnv("NEXT_PUBLIC_STREAM_API_KEY"),
    getRequiredEnv("STREAM_API_SECRET"),
  );
}

export async function upsertStreamUser(user: StreamUserPayload) {
  const videoClient = getStreamVideoServerClient();
  const chatClient = getStreamChatServerClient();

  await Promise.all([
    videoClient.upsertUsers([
      {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    ]),
    chatClient.upsertUser({
      id: user.id,
      name: user.name,
      image: user.image,
    }),
  ]);
}
