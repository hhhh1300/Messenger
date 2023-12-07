import { z } from "zod";
import { db } from "@/db";
import { messagesTable, messagesToChatroomsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { privateEnv } from "@/lib/env/private";
import { publicEnv } from "@/lib/env/public";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import Pusher from "pusher";

const messageRequestSchema = z.object({
  senderId: z.string().min(1).max(100),
  content: z.string().min(1).max(280),
  highlight: z.boolean(),
  visible: z.boolean(),
});

type messageRequest = z.infer<typeof messageRequestSchema>;

export async function GET (req : NextRequest, {params}: {params: {chatroomId: string}}) {
  try {
    const session = await auth();
    if (!session || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // const userId = session.user.id;

    const dbChatroom = await db.query.messagesToChatroomsTable.findMany({
      where: and(
        eq(messagesToChatroomsTable.chatroomId, params.chatroomId)
      ),
      with: {
        chatroom: {
          columns: {
            displayId: true,
            image: true,
          },
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
    });
  
    if (dbChatroom.length === 0) {
      // console.log("not found");
      return NextResponse.json(null, { status: 200 });
    }
    const dbMessages = dbChatroom.map((dbChatroom) => dbChatroom.message);
    if (dbMessages.length === 0) {
      // console.log("not found");
      return NextResponse.json(null, { status: 200 });
    }
    // console.log(dbMessages, dbChatroom);
    dbMessages.sort((m1, m2) => {
      if (m1.createdAt! > m2.createdAt!)
        return 1;
      if (m1.createdAt! < m2.createdAt!)
        return -1;
      return 0;
    })
    const chatroomId = dbChatroom[0].chatroom.displayId;
    return NextResponse.json(
      {
        id: chatroomId,
        messages: dbMessages,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({error: "Internal Server Error"}, {status: 500});
  }
}

export async function POST (req : NextRequest, {params}: {params: {chatroomId: string}}) {
  const data = await req.json();

  try {
    messageRequestSchema.parse(data);
  } catch (error) {
    return NextResponse.json({ error: "[MESSAGE POST]: invalid request"}, { status: 400 });
  }

  const {content, senderId, highlight, visible} = data as messageRequest;
  console.log(content, senderId, highlight, visible);

  try {
    const session = await auth();
    if (!session || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    if (userId !== senderId) {
      console.log("userId !== senderId");
      return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }

    const createMessage = await db.transaction(async (tx) => {
      const [newMessage] = await tx
      .insert(messagesTable)
      .values({
        senderId: userId,
        content,
        highlight,
        visible
      })
      .returning();
      await tx.insert(messagesToChatroomsTable).values({
        messageId: newMessage.displayId,
        chatroomId: params.chatroomId
      });
      return newMessage;
    })
    // console.log(createMessage);

    const dbChatroom = await db.query.messagesToChatroomsTable.findMany({
      where: and(
        eq(messagesToChatroomsTable.chatroomId, params.chatroomId)
      ),
      with: {
        chatroom: {
          columns: {
            displayId: true,
            image: true,
          },
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
      // orderBy: asc(messagesTable.createdAt)
    });

    // console.log(dbChatroom);
  
    if (dbChatroom.length === 0) {
      return NextResponse.json({ error: "Doc Not Found" }, { status: 404 });
    }
    const dbMessages = dbChatroom.map((dbChatroom) => dbChatroom.message);
    dbMessages.sort((m1, m2) => {
      if (m1.createdAt! > m2.createdAt!)
        return 1;
      if (m1.createdAt! < m2.createdAt!)
        return -1;
      return 0;
    })
    // Trigger pusher event
    const pusher = new Pusher({
      appId: privateEnv.PUSHER_ID,
      key: publicEnv.NEXT_PUBLIC_PUSHER_KEY,
      secret: privateEnv.PUSHER_SECRET,
      cluster: publicEnv.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });
    
    // Private channels are in the format: private-...
    await pusher.trigger(`private-${params.chatroomId}`, "message:update", {
      senderId: userId,
      messages: {
        senderId: createMessage.senderId,
        messages: dbMessages
      },
    });

    return NextResponse.json(
      "OK",
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({error: "Internal Server Error"}, {status: 500});
  }
}

export async function PUT (req : NextRequest, {params}: {params: {chatroomId: string}}) {
  const data = await req.json();
  const messageRequestWithChatroomIdSchema = messageRequestSchema.extend({
    messageId: z.string(),
  });
  try {
    messageRequestWithChatroomIdSchema.parse(data);
  } catch (error) {
    return NextResponse.json({ error: "[MESSAGE PUT]: invalid request"}, { status: 400 });
  }
  
  try {
    const {highlight, visible, messageId} = data as z.infer<typeof messageRequestWithChatroomIdSchema>;
    const session = await auth();
    if (!session || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [message] = await db
    .select({
      messageId: messagesToChatroomsTable.messageId,
    }) 
    .from(messagesToChatroomsTable)
    .where(
      and(
        eq(messagesToChatroomsTable.messageId, messageId),
        eq(messagesToChatroomsTable.chatroomId, params.chatroomId)
      )
    ).execute();
    if (!message) {
      return NextResponse.json({ error: "Message Not Found" }, { status: 404 });
    }

    if (highlight) {
      const messages = await db.query.messagesToChatroomsTable.findMany({
        where: and(
          eq(messagesToChatroomsTable.chatroomId, params.chatroomId)
        ),
        with:{
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
        }
      })
      const highlightMessage = messages.find((msg) => {
        return msg.message.highlight;
      });
      console.log("highligthted", highlightMessage);
      if (highlightMessage) {
        const [updateMessage] = await db
          .update(messagesTable)
          .set({
            highlight: false,
          })
          .where(eq(messagesTable.displayId, highlightMessage.message.displayId))
          .returning();
        console.log(updateMessage);
      }
    }

    const [updateMessage] = await db
      .update(messagesTable)
      .set({
        highlight,
        visible,
      })
      .where(eq(messagesTable.displayId, messageId))
      .returning();
    console.log("updateMessage", updateMessage);

    const dbChatroom = await db.query.messagesToChatroomsTable.findMany({
      where: and(
        eq(messagesToChatroomsTable.chatroomId, params.chatroomId)
      ),
      with: {
        chatroom: {
          columns: {
            displayId: true,
            image: true,
          },
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
      // orderBy: asc(messagesTable.createdAt)
    });

    // console.log(dbChatroom);
  
    if (dbChatroom.length === 0) {
      return NextResponse.json({ error: "Doc Not Found" }, { status: 404 });
    }
    const dbMessages = dbChatroom.map((dbChatroom) => dbChatroom.message);
    dbMessages.sort((m1, m2) => {
      if (m1.createdAt! > m2.createdAt!)
        return 1;
      if (m1.createdAt! < m2.createdAt!)
        return -1;
      return 0;
    })
    const pusher = new Pusher({
      appId: privateEnv.PUSHER_ID,
      key: publicEnv.NEXT_PUBLIC_PUSHER_KEY,
      secret: privateEnv.PUSHER_SECRET,
      cluster: publicEnv.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });

    await pusher.trigger(`private-${params.chatroomId}`, "message:update", {
      senderId: userId,
      messages: {
        senderId: userId,
        messages: dbMessages
      },
    });

    return NextResponse.json(
      "OK",
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

}

export async function DELETE (req : NextRequest, {params}: {params: {chatroomId: string}}) {
  const data = await req.json();
  const messageRequestWithChatroomIdSchema = messageRequestSchema.extend({
    messageId: z.string(),
  });
  try {
    messageRequestWithChatroomIdSchema.parse(data);
  } catch (error) {
    return NextResponse.json({ error: "[MESSAGE PUT]: invalid request"}, { status: 400 });
  }
  
  try {
    const {messageId} = data as z.infer<typeof messageRequestWithChatroomIdSchema>;
    const session = await auth();
    if (!session || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [message] = await db
    .select({
      messageId: messagesToChatroomsTable.messageId,
    }) 
    .from(messagesToChatroomsTable)
    .where(
      and(
        eq(messagesToChatroomsTable.messageId, messageId),
        eq(messagesToChatroomsTable.chatroomId, params.chatroomId)
      )
    ).execute();
    if (!message) {
      return NextResponse.json({ error: "Message Not Found" }, { status: 404 });
    }

    await db
    .delete(messagesTable)
    .where(eq(messagesTable.displayId, messageId));

    const dbChatroom = await db.query.messagesToChatroomsTable.findMany({
      where: and(
        eq(messagesToChatroomsTable.chatroomId, params.chatroomId)
      ),
      with: {
        chatroom: {
          columns: {
            displayId: true,
            image: true,
          },
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
      // orderBy: asc(messagesTable.createdAt)
    });

    // console.log(dbChatroom);
  
    if (dbChatroom.length === 0) {
      return NextResponse.json({ error: "Doc Not Found" }, { status: 404 });
    }
    const dbMessages = dbChatroom.map((dbChatroom) => dbChatroom.message);
    dbMessages.sort((m1, m2) => {
      if (m1.createdAt! > m2.createdAt!)
        return 1;
      if (m1.createdAt! < m2.createdAt!)
        return -1;
      return 0;
    })
    const pusher = new Pusher({
      appId: privateEnv.PUSHER_ID,
      key: publicEnv.NEXT_PUBLIC_PUSHER_KEY,
      secret: privateEnv.PUSHER_SECRET,
      cluster: publicEnv.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });

    await pusher.trigger(`private-${params.chatroomId}`, "message:update", {
      senderId: userId,
      messages: {
        senderId: userId,
        messages: dbMessages
      },
    });

    return NextResponse.json(
      "OK",
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

}