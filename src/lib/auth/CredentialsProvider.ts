import CredentialsProvider from "next-auth/providers/credentials";
import { authSchema } from "../validators/auth";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";


type ValidCredentials = {
  email?: string;
  username: string;
  password: string;
  image?: string;
};

export default CredentialsProvider({
  name: "credentials",
  credentials: {
    email: {label: "email", type: "text", optional: true},
    username: {label: "username", type: "text"},
    image: {label: "image", type: "text", optional: true},
    password: {label: "password", type: "password"}
  },
  async authorize(credentials) {
    console.log({...credentials, email: credentials.email === "" ? undefined : credentials.email});
    let validCredentials : ValidCredentials;
    try {
      validCredentials = authSchema.parse({...credentials, email: credentials.email === "" ? undefined : credentials.email});
    } catch (error) {
      console.log("Wrong credentials [Parse Error]. Try again.");
      console.log(error);
      return null;
    }

    const {email, username, password, image} = validCredentials;
    const [existedUser] = await db
    .select({
      id: usersTable.displayId,
      username: usersTable.username,
      email: usersTable.email,
      provider: usersTable.provider,
      hashedPassword: usersTable.hashedPassword,
      image: usersTable.image,
    })
    .from(usersTable)
    .where(eq(usersTable.username, validCredentials.username))
    .execute();

    if (!existedUser) {
      // Sign Up
      if (!username) {
        console.log("Name is required.");
        return null;
      }
      if (!email) {
        console.log("Email is required.");
        return null;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const [createdUser] = await db
      .insert(usersTable)
      .values({
        username,
        email: email.toLowerCase(),
        provider: "credentials",
        hashedPassword,
        image: image?.length ? image : "https://t0.gstatic.com/licensed-image?q=tbn:ANd9GcR2blyVMQtT2nXEr8UKiJ_8olhnnvEsPuV5exXRxt6smD4fkOm8xFnNKhhkTshGLTeNhOJ2GeI7SGf28VZzwHI",
      })
      .returning();
      return {
        email: createdUser.email,
        name: createdUser.username,
        image: createdUser.image,
        id: createdUser.displayId,
      };
    }
    // Sign In
    if (existedUser.provider !== "credentials") {
      console.log(`The email has registered with ${existedUser.provider}.`);
      return null;
    }
    if (!existedUser.hashedPassword) {
      console.log("The email has registered with social account.");
      return null;
    }
    const isValid = await bcrypt.compare(password, existedUser.hashedPassword);
    if (!isValid) {
      console.log("Wrong password. Try again.");
      return null;
    }

    return {
      email: existedUser.email,
      name: existedUser.username,
      image: existedUser.image,
      id: existedUser.id,
    }
  }
}) 