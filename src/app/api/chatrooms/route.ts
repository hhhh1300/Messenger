import { db } from "@/db";
import { usersToChatroomsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET (req : NextRequest) {
  const data = await req.json();
  try {
    const session = await auth();
    if (!session || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    console.log(data);
    const dbChatroom = await db.query.usersToChatroomsTable.findMany({
      where: and(
        eq(usersToChatroomsTable.userId, userId),
      ),
      with: {
        chatroom: {
          columns: {
            displayId: true,
            image: true,
            createdAt: true
          },
        }
      }
    });
    if (!dbChatroom) {
      return NextResponse.json({ error: "Doc Not Found" }, { status: 404 });
    }
    return NextResponse.json(
      {
        dbChatroom
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({error: "Internal Server Error"}, {status: 500});
  }
}