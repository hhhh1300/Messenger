import { z } from "zod";

export const authSchema = z.object({
  // Sign in doesn't require a username, but sign up does.
  username: z.string(),
  email: z.string().email().optional(),
  // Passwords must be at least 4 characters long.
  password: z.string().min(4),
  image: z.string().optional()
});
