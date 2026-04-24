import { z } from "zod";

export const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Room name must be at least 3 characters.")
    .max(48, "Room name must be 48 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(3, "Description must be at least 3 characters.")
    .max(240, "Description must be 240 characters or fewer."),
  maxParticipants: z.coerce
    .number()
    .int("Participant limit must be a whole number.")
    .min(2, "Participant limit must be at least 2.")
    .max(100, "Participant limit cannot exceed 100."),
});

export const patchParticipantsSchema = z.object({
  participantsCount: z.number().int().min(0).max(1000),
});
