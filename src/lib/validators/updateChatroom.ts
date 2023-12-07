import { z } from "zod";

export const updateChatroomSchema = z.object({
  image: z.string().optional(),
});
