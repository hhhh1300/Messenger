import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

import CredentialsProvider from "./CredentialsProvider";

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  providers: [GitHub, CredentialsProvider],
  callbacks: {
    async session({ session, token }) {
      // const email = token.email || session?.user?.email;
      const name = token.name || session?.user?.username;
      if (!name) return session;
      const [user] = await db
        .select({
          id: usersTable.displayId,
          username: usersTable.username,
          email: usersTable.email,
          provider: usersTable.provider,
          image: usersTable.image,
        })
        .from(usersTable)
        .where(eq(usersTable.username, name))
        .execute();
      return {
        ...session,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          provider: user.provider,
          image: user.image
        },
      }
    },
    async jwt({ token, account }) {
      if (!account) return token;
      const { name, email } = token;
      const provider = account.provider;
      if (!name || !email || !provider) return token;

      const [existedUser] = await db
        .select({
          id: usersTable.displayId,
        })
        .from(usersTable)
        .where(eq(usersTable.username, name))
        .execute();
      if (existedUser) return token;
      if (provider !== "github") return token;

      // Sign up
      await db.insert(usersTable).values({
        username: name,
        email: email.toLowerCase(),
        provider,
      });

      return token;
    }
  },
  pages: {
    signIn: '/',
    error: '/',
  },
});