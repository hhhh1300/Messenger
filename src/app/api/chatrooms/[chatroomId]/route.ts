import { db } from "@/db";
import { chatroomsTable, usersToChatroomsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { privateEnv } from "@/lib/env/private";
import { publicEnv } from "@/lib/env/public";
import { type Chatroom } from "@/lib/types/db";
import { updateChatroomSchema } from "@/lib/validators/updateChatroom";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import Pusher from "pusher";

export async function GET (req : NextRequest, {params}: {params: {chatroomId: string}}) {
  try {
    const session = await auth();
    if (!session || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const dbChatroom = await db.query.usersToChatroomsTable.findMany({
      where: and(
        eq(usersToChatroomsTable.userId, userId),
        eq(usersToChatroomsTable.chatroomId, params.chatroomId)
      ),
      with: {
        chatroom: {
          columns: {
            displayId: true,
            image: true,
          },
        },
        user: {
          columns: {
            displayId: true,
            username: true
          }
        }
      }
    });
    if (!dbChatroom) {
      return NextResponse.json({ error: "Doc Not Found" }, { status: 404 });
    }
    const dbUsers = dbChatroom.map((dbChatroom) => dbChatroom.user);

    const chatroomId = dbChatroom[0].chatroom.displayId;
    return NextResponse.json(
      {
        id: chatroomId,
        users: dbUsers,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({error: "Internal Server Error"}, {status: 500});
  }
}

export async function PUT(req: NextRequest, { params }: { params: { chatroomId: string } }) {
  try {
    const session = await auth();
    if (!session || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [chatroom] = await db
    .select({
      chatroomId: usersToChatroomsTable.chatroomId
    }) 
    .from(usersToChatroomsTable)
    .where(
      and(
        eq(usersToChatroomsTable.userId, userId),
        eq(usersToChatroomsTable.chatroomId, params.chatroomId)
      )
    )
    .execute();
    if (!chatroom) {
      return NextResponse.json({ error: "Chatroom Not Found" }, { status: 404 });
    }

    const reqBody = await req.json();
    let validatedReqBody: Partial<Omit<Chatroom, "id">>;
    try {
      validatedReqBody = updateChatroomSchema.parse(reqBody);
    } catch (error) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const [updateChatroom] = await db
      .update(chatroomsTable)
      .set(validatedReqBody)
      .where(eq(chatroomsTable.displayId, params.chatroomId))
      .returning();

    const pusher = new Pusher({
      appId: privateEnv.PUSHER_ID,
      key: publicEnv.NEXT_PUBLIC_PUSHER_KEY,
      secret: privateEnv.PUSHER_SECRET,
      cluster: publicEnv.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });

    await pusher.trigger(`private-${updateChatroom.displayId}`, "chatroom:update", {
      senderId: userId,
      chatroom: {
        id: updateChatroom.displayId,
        image: updateChatroom.image
      }
    })

    return NextResponse.json(
      {
        id: updateChatroom.displayId,
        image: updateChatroom.image
      },
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