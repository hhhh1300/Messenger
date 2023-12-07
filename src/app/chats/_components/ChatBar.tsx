import { auth } from "@/lib/auth";
// import { publicEnv } from "@/lib/env/public";
import { redirect } from "next/navigation";
import { addChatroomUser, createChatroom, deleteChatroom, findChatroom, getChatroomUser, getChatrooms, getMessages, getRelatedChatrooms, getUser } from "./action";
import { Button } from "@/components/ui/button";
import { GoSignOut } from "react-icons/go"
import { BiSolidCommentAdd } from "react-icons/bi"
import { FcInvite } from "react-icons/fc"
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AiFillDelete, AiOutlineSearch } from "react-icons/ai";

type Message = {
  id: number;
  messageId: string;
  chatroomId: string;
  chatroom: { 
    displayId: string ;
  };
  message: {
    displayId: string;
    content: string;
    senderId: string;
    highlight: boolean;
    visible: boolean;
    createdAt: Date | null;
  };
};

export default async function ChatBar() {
  const session = await auth();
  if (!session || !session?.user?.id) {
    redirect('/');
  }
  const userId = session?.user?.id;
  
  const chatrooms = await getChatrooms(userId);
  const relatedChatrooms = await getRelatedChatrooms(userId);
  const messages: {chatroomId: string, message: Message[]}[] = [];
  for (let i = 0; i < chatrooms.length; i++) {
    const message = await getMessages(chatrooms[i].chatroomId);
    messages.push({chatroomId: chatrooms[i].chatroomId, message});
  }

  return (
    <>
      <div>
        <div className="flex flex-row items-center font-bold ml-5 mt-3 text-3xl">
          <span>
            Chat
          </span>
          <div className="flex flex-row items-center ml-auto mr-5">
            <Link href={`/auth/signout`}>
              <Button variant="ghost" className="p-2 ml-4 hover:bg-slate-200" size="sm">
                <GoSignOut size={22}/>
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger><BiSolidCommentAdd size={22}/></DialogTrigger>
              <DialogContent className="flex flex-col">
                <DialogHeader>
                  <DialogTitle>Invite other user to chat with you</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col">
                  <form
                    className="w-full"
                    action={async (e : FormData) => {
                      "use server";
                      console.log(e.get('toUser'), userId);
                      const toUser = e.get('toUser')?.toString();
                      if (!toUser) {
                        return;
                      }
                      // try {
                        const res = await getUser(toUser);
                        if (!res && toUser != userId) {
                          console.log("user dne");
                          redirect(`/chats/userNotExisted`);
                        }
                        if (!await getChatroomUser(userId, toUser)) {
                          console.log("existed");
                          redirect(`/chats/existed`);
                        }
                        const newChatroomId = await createChatroom(userId);
                        console.log(newChatroomId);
                        await addChatroomUser(newChatroomId, toUser ?? userId);
                        revalidatePath("/chats");
                        redirect(`/chats/${newChatroomId}`);
                      // } catch (error) {
                      //   console.log(error);
                      //   console.log("something went wrong!");
                      // }
                    }}
                  >
                    <Label htmlFor="toUser" className="text-right">
                      Invite User
                    </Label>
                    <Input
                      placeholder="username"
                      id="toUser"
                      defaultValue=""
                      name="toUser"
                    />
                    <Button variant={"ghost"} className="p-2 m-2 hover:bg-slate-200 ml-auto" size="sm">
                      <FcInvite size={22}/>
                    </Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>

          </div>
        </div>
        <div className="flex flex-row">
          <form
            className="w-full flex flex-row items-center"
            action={async (e : FormData) => {
              "use server";
              const searchValue = e.get('Search')?.toString();
              if (!searchValue)
                return;
              const res = await findChatroom(searchValue, userId);
              console.log(res);
              if (!res) {
                redirect(`/chats/NewChatroom`)
                // const res = prompt("是否新增聊天室?", "輸入yes/no");
                // if (res === "yes") {
                  // try {
                  //   const res = await getUser(searchValue);
                  //   if (!res && searchValue != userId) {
                  //     console.log("user dne");
                  //     throw new Error;
                  //   }
                  //   const newChatroomId = await createChatroom(userId);
                  //   console.log(newChatroomId);
                  //   await addChatroomUser(newChatroomId, searchValue ?? userId);
                  //   revalidatePath("/chats");
                  //   redirect(`${publicEnv.NEXT_PUBLIC_BASE_URL}/chats/${newChatroomId}`);
                  // } catch (error) {
                  //   console.log(error);
                  //   console.log("something went wrong!");
                  // }
                // }
              } else {
                redirect(`/chats/${res}`);
              }
            }}
          >
            <Input
              placeholder="Search"
              id="Search"
              defaultValue=""
              name="Search"
            />
            <Button variant={"ghost"} className="p-2 m-2 hover:bg-slate-200 ml-auto" size="sm">
              <AiOutlineSearch size={22}/>
            </Button>
          </form>
        </div>
        <section>
          {chatrooms.map((chatroom, i) => {
            if (!relatedChatrooms) {
              return (<></>);
            }
            const [cr] = relatedChatrooms.filter((croom) => {return croom.chatroomId === chatroom.chatroom.displayId});
            console.log(cr);
            const targetCr = cr?.relatedChatroom.find((chatroom) => chatroom.userId !== userId);
            const [messageByChatroom] = messages.filter((msg) => {
              return msg.chatroomId === chatroom.chatroom.displayId
            });
            // console.log("targetCr", targetCr);
            // console.log("cr", messageByChatroom.message.slice(-1)[0]);
            return (
              <div
                key={i}
                className="group flex w-full cursor-pointer items-center justify-between gap-2 text-slate-400 hover:bg-slate-200 hover:rounded"
              >
                <Link
                  className="grow px-3 py-1"
                  href={`/chats/${chatroom.chatroom.displayId}`}
                >
                  <div className="flex items-center gap-2 text-black">
                    {targetCr?.user.username ?? ""}
                    <span className="text-sm font-light truncate w-[14em] text-slate-400">
                      {messageByChatroom?.message.slice(-1)[0]?.message.content ?? ""}
                    </span>
                  </div>
                </Link>
                <form
                  className="hidden px-2 text-slate-400 hover:text-red-400 group-hover:flex"
                  action={async () => {
                    "use server";
                    const chatroomId = chatroom.chatroom.displayId;
                    await deleteChatroom(chatroomId);
                    revalidatePath("/chats");
                    try {
                      redirect(`/chats`);
                    } catch (error) {
                      console.log(error);
                    }
                  }}
                >
                  <button type={"submit"}>
                    <AiFillDelete size={16} />
                  </button>
                </form>
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}