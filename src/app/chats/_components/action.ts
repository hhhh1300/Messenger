import { db } from "@/db";
import { chatroomsTable, messagesToChatroomsTable, usersTable, usersToChatroomsTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";

type RelatedChatroom = {
  id: number;
  userId: string;
  chatroomId: string;
  user: {
      displayId: string;
      username: string;
      image: string;
  };
};

export const createChatroom = async (userId: string) => {
  "use server";
  console.log("[createChatroom]");

  const newChatroomId = await db.transaction(async (tx) => {
    const [newChatroom] = await tx
      .insert(chatroomsTable)
      .values({
        image: "https://t0.gstatic.com/licensed-image?q=tbn:ANd9GcR2blyVMQtT2nXEr8UKiJ_8olhnnvEsPuV5exXRxt6smD4fkOm8xFnNKhhkTshGLTeNhOJ2GeI7SGf28VZzwHI",

      })
      .returning();
    await tx.insert(usersToChatroomsTable).values({
      userId: userId,
      chatroomId: newChatroom.displayId
    });
    return newChatroom.displayId;
  })
  return newChatroomId;
}

export const getChatrooms = async (userId: string) => {
  "use server";

  const chatrooms = await db.query.usersToChatroomsTable.findMany({
    where: eq(usersToChatroomsTable.userId, userId),
    with: {
      chatroom: {
        columns: {
          displayId: true,
          image: true,
          createdAt: true
        }
      }
    }
  })
  return chatrooms;
}
export const getRelatedChatrooms = async (userId: string) => {
  "use server";
  console.log("[GET related chatrooms]");

  const chatrooms = await db.query.usersToChatroomsTable.findMany({
    where: eq(usersToChatroomsTable.userId, userId),
    with: {
      chatroom: {
        columns: {
          displayId: true,
          image: true,
        }
      }
    }
  });
  if (!chatrooms)
    return;
  const relatedChatrooms : {chatroomId: string, relatedChatroom: RelatedChatroom[]}[] = [];
  for (let i = 0; i < chatrooms.length; i++) {
    const relatedChatroom = await db.query.usersToChatroomsTable.findMany({
      where: eq(usersToChatroomsTable.chatroomId, chatrooms[i].chatroomId),
      with: {
        user: {
          columns: {
            displayId: true,
            username: true,
            image: true,
          }
        }
      }
    });
    // console.log(relatedChatroom);
    relatedChatrooms.push({chatroomId: chatrooms[i].chatroomId, relatedChatroom});
  }
  const retRelatedChatrooms = relatedChatrooms.filter((relatedChatroom) => {
    // console.log(userId, relatedChatroom.relatedChatroom.find((chatroom) => chatroom.user.displayId !== userId));
    return relatedChatroom.relatedChatroom.find((chatroom) => chatroom.user.displayId !== userId);
  });
  // console.log("relatedChatrooms", retRelatedChatrooms)
  return retRelatedChatrooms;
}

export const getChatroomsByChatroomId = async (chatroomId: string) => {
  "use server";

  const chatrooms = await db.query.usersToChatroomsTable.findMany({
    where: eq(usersToChatroomsTable.chatroomId, chatroomId),
    with: {
      chatroom: {
        columns: {
          displayId: true,
          image: true,
        }
      }
    }
  })
  return chatrooms;
}
export const deleteChatroom = async (chatroomId: string) => {
  "use server";
  console.log("[deleteChatroom]");
  await db
    .delete(chatroomsTable)
    .where(eq(chatroomsTable.displayId, chatroomId));
  return;
};

export const addChatroomUser = async (chatroomId: string, userId: string) => {
  "use server";
  // Find the user by userId
  const [user] = await db
    .select({
      displayId: usersTable.displayId,
    })
    .from(usersTable)
    .where(eq(usersTable.username, userId));
  if (!user) {
    return false;
  }

  await db.insert(usersToChatroomsTable).values({
    chatroomId: chatroomId,
    userId: user.displayId,
  });
};

export const getChatroomUser = async (userId2: string, userId: string) => {
  "use server";
  // Find the user by userId
  console.log("[getChatroomUser]");
  const [user] = await db
    .select({
      displayId: usersTable.displayId,
    })
    .from(usersTable)
    .where(eq(usersTable.username, userId));
  if (!user) {
    return false;
  }

  const chatrooms1 = await db.query.usersToChatroomsTable.findMany({
    where: eq(usersToChatroomsTable.userId, user.displayId),
    with: {
      chatroom: {
        columns: {
          displayId: true,
          image: true,
        }
      }
    }
  })
  const chatrooms2 = await db.query.usersToChatroomsTable.findMany({
    where: eq(usersToChatroomsTable.userId, userId2),
    with: {
      chatroom: {
        columns: {
          displayId: true,
          image: true,
        }
      }
    }
  })
  for (let i = 0; i < chatrooms1.length; i++) {
    for (let j = 0; j < chatrooms2.length; j++) {
      console.log(chatrooms1[i].chatroom.displayId ,chatrooms2[j].chatroom.displayId)
      if (chatrooms1[i].chatroom.displayId === chatrooms2[j].chatroom.displayId) {
        return false;
      }
    }
  }
  return true;
};

export const getUser = async (userId: string) => {
  "use server";
  console.log("[getUser]", userId);
  const [user] = await db
    .select({
      displayId: usersTable.displayId,
    })
    .from(usersTable)
    .where(eq(usersTable.username, userId));
  // console.log(user);
  if (!user) {
    return false;
  }
  return true;
};

export const getMessages = async (chatroomId: string) => {
  "use server";

  const messages = await db.query.messagesToChatroomsTable.findMany({
    where: and(
      eq(messagesToChatroomsTable.chatroomId, chatroomId),
    ),
    with: {
      chatroom: {
        columns: {
          displayId: true,
        }
      },
      message: {
        columns: {
          displayId: true,
          content: true,
          senderId: true,
          highlight: true,
          visible: true,
          createdAt: true,
        }
      }
    },
    // orderBy: desc(messagesTable.createdAt),
  });
  // console.log(messages);

  return messages;
}

export const findChatroom = async (username: string, userId2: string) => {
  "use server";
  const [user] = await db
    .select({
      displayId: usersTable.displayId,
    })
    .from(usersTable)
    .where(eq(usersTable.username, username));
  if (!user) {
    return;
  }
  const userId = user.displayId;
  const chatrooms = await db.query.usersToChatroomsTable.findMany({
    where: eq(usersToChatroomsTable.userId, userId),
    with: {
      user: {
        columns: {
          displayId: true,
        }
      },
      chatroom: {
        columns: {
          displayId: true,
        }
      }
    }
  });
  const chatrooms2 = await db.query.usersToChatroomsTable.findMany({
    where: eq(usersToChatroomsTable.userId, userId2),
    with: {
      user: {
        columns: {
          displayId: true,
        }
      },
      chatroom: {
        columns: {
          displayId: true,
        }
      }
    }
  });
  let res = null;
  for (let i = 0; i < chatrooms.length; i++) {
    for (let j = 0; j < chatrooms2.length; j++) {
      if (chatrooms[i].chatroom.displayId === chatrooms2[j].chatroom.displayId) {
        res = chatrooms[i].chatroom.displayId;
      }
    }
  }
  return res;
}