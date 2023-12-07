import { relations, sql } from "drizzle-orm";
import {
  index,
  text,
  pgTable,
  serial,
  uuid,
  varchar,
  unique,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    displayId: uuid("display_id").defaultRandom().notNull().unique(),
    username: varchar("username", {length: 100}).notNull().unique(),
    email: varchar("email", {length: 100}).notNull().unique(),
    hashedPassword: varchar("hashed_password", {length: 100}),
    provider: varchar("provider", {
      length: 100,
      enum: ["github", "credentials"]
    }).notNull(),
    image: varchar("image", {length: 250})
          .default("https://t0.gstatic.com/licensed-image?q=tbn:ANd9GcR2blyVMQtT2nXEr8UKiJ_8olhnnvEsPuV5exXRxt6smD4fkOm8xFnNKhhkTshGLTeNhOJ2GeI7SGf28VZzwHI")
          .notNull()
  },
  (table) => ({
    displayIdIndex: index("display_id_index").on(table.displayId),
    emailIndex: index("email_index").on(table.email),
  })
)

export const usersRelations = relations(usersTable, ({ many }) => ({
  usersToDocumentsTable: many(usersToChatroomsTable),
}));

export const chatroomsTable = pgTable(
  "chatrooms",
  {
    id: serial("id").primaryKey(),
    displayId: uuid("display_id").defaultRandom().notNull().unique(),
    image: varchar("image", {length: 250})
          .default("https://t0.gstatic.com/licensed-image?q=tbn:ANd9GcR2blyVMQtT2nXEr8UKiJ_8olhnnvEsPuV5exXRxt6smD4fkOm8xFnNKhhkTshGLTeNhOJ2GeI7SGf28VZzwHI")
          .notNull(),
    // content: text("content").notNull(),
    createdAt: timestamp("created_at").default(sql`now()`),
  },
  (table) => ({
    displayIdIndex: index("display_id_index").on(table.displayId),
  }),
);

export const chatroomsRelations = relations(chatroomsTable, ({ many }) => ({
  usersToChatroomsTable: many(usersToChatroomsTable),
  messagesTable: many(messagesTable),
}));

export const usersToChatroomsTable = pgTable(
  "users_to_chatrooms",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.displayId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    chatroomId: uuid("document_id")
      .notNull()
      .references(() => chatroomsTable.displayId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => ({
    userAndChatroomIndex: index("user_and_chatroom_index").on(
      table.userId,
      table.chatroomId,
    ),
    // This is a unique constraint on the combination of userId and documentId.
    // This ensures that there is no duplicate entry in the table.
    uniqCombination: unique().on(table.chatroomId, table.userId),
  }),
);

export const usersToChatroomsRelations = relations(
  usersToChatroomsTable,
  ({ one }) => ({
    chatroom: one(chatroomsTable, {
      fields: [usersToChatroomsTable.chatroomId],
      references: [chatroomsTable.displayId],
    }),
    user: one(usersTable, {
      fields: [usersToChatroomsTable.userId],
      references: [usersTable.displayId],
    }),
  }),
);

export const messagesTable = pgTable(
  'messages', 
  {
    id: serial('id').primaryKey(),
    displayId: uuid("display_id").defaultRandom().notNull().unique(),
    senderId: varchar('sender_id', {length: 100}).notNull(),
    content: text('content').notNull(),
    highlight: boolean('highlight').default(false).notNull(),
    visible: boolean('visible').default(true).notNull(),
    createdAt: timestamp("created_at").default(sql`now()`),
  },
  (table) => ({
    displayIdIndex: index("display_id_index").on(table.displayId),
  }),
);


export const messagesRelations = relations(messagesTable, ({ many }) => ({
  messagesToChatroomsTable: many(messagesToChatroomsTable),
}));

export const messagesToChatroomsTable = pgTable(
  "messages_to_chatrooms",
  {
    id: serial("id").primaryKey(),
    messageId: uuid("messages_id")
      .notNull()
      .references(() => messagesTable.displayId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    chatroomId: uuid("document_id")
      .notNull()
      .references(() => chatroomsTable.displayId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => ({
    messageAndChatroomIndex: index("message_and_chatroom_index").on(
      table.messageId,
      table.chatroomId,
    ),
    // This is a unique constraint on the combination of userId and documentId.
    // This ensures that there is no duplicate entry in the table.
    uniqCombination: unique().on(table.chatroomId, table.messageId),
  }),
);

export const messagesToChatroomsRelations = relations(
  messagesToChatroomsTable,
  ({ one }) => ({
    chatroom: one(chatroomsTable, {
      fields: [messagesToChatroomsTable.chatroomId],
      references: [chatroomsTable.displayId],
    }),
    message: one(messagesTable, {
      fields: [messagesToChatroomsTable.messageId],
      references: [messagesTable.displayId],
    }),
  }),
);