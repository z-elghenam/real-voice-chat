import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().trim().min(3).max(48),
  description: z.string().trim().min(10).max(240),
  maxParticipants: z.coerce.number().int().min(2).max(100),
});

export const patchParticipantsSchema = z.object({
  participantsCount: z.number().int().min(0).max(1000),
});
