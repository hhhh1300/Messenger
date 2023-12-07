import { auth } from "@/lib/auth";
import { publicEnv } from "@/lib/env/public";
import { redirect } from "next/navigation";
import { BiError } from "react-icons/bi";
import { getChatrooms } from "./_components/action";
import { headers } from "next/headers";

async function ChatsPage() {
  const session = await auth();
  if (!session || !session?.user?.id) {
    redirect('/');
  }
  const userId = session?.user?.id;
  
  const chatrooms = await getChatrooms(userId);
  const headersList = headers();
  const pathname = headersList.get('referer') || "notfound";
  console.log("pathname", pathname);
  if (chatrooms.length > 0) {
    let latestChatroom = chatrooms[0];
    for (let i = 1; i < chatrooms.length; i++) {
      if (latestChatroom.chatroom.createdAt! < chatrooms[i].chatroom.createdAt!) {
        latestChatroom = chatrooms[i];
      }
    }
    const regPathname = /[.]*localhost:3000\/$/;
    if (regPathname.test(pathname)){
      // console.log(`${publicEnv.NEXT_PUBLIC_BASE_URL}/chats/${latestChatroom.chatroomId}`);
      redirect(`/chats/${latestChatroom.chatroomId}`)
    }
  }
  return (
    <div className="flex h-[90vh] w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <BiError className="text-yellow-500" size={80} />
        <p className="text-sm font-semibold text-slate-700">
          Please select a chatroom to start chatting
        </p>
      </div>
    </div>
  );
}
export default ChatsPage;
