import { useCallback, useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

// import { useDebounce } from "use-debounce";

import { pusherClient } from "@/lib/pusher/client";
import type { Chatroom, User, Message } from "@/lib/types/db";



type ChatroomPusherPayload = {
  senderId: User["id"];
  chatroom: Chatroom;
};
type MessagePusherPayload = {
  senderId: User["id"];
  messages: Message[];
};

export function useChatroom() {
  const { chatId } = useParams();
  const chatroomId = Array.isArray(chatId) ? chatId[0] : chatId;

  const [chatroom, setChatroom] = useState<Chatroom | null>(null);
  const [messages, setMessages] = useState<Message[]>();
  const [havePostMessage, setHavePostMessage] = useState<boolean>(false);
  
  // const [dbChatroom, setDbChatroom] = useState<Chatroom | null>(null);
  const router = useRouter();

  const { data: session } = useSession();
  const userId = session?.user?.id;

  // const isSynced = useMemo(() => {
  //   if (chatroom === null || dbChatroom === null) return true;
  //   return (
  //     chatroom.image === dbChatroom.image
  //   );
  // }, [chatroom, dbChatroom]);

  // Subscribe to pusher events
  const fetchMessages = useCallback(
    async () => {
      const res = await fetch(`/api/messages/${chatroomId}`);
      if (!res.ok) {
        router.push("/chats");
        return;
      }
      const data = await res.json();
      if (data) {
        setMessages(data.messages);
        // console.log(data.messages);
      }
    }, [chatroomId, router]
  ) 

  useEffect(() => {
    if (!chatroomId) return;
    // Private channels are in the format: private-...
    const channelName = `private-${chatroomId}`;
    
    try {
      const channel = pusherClient.subscribe(channelName);
      channel.bind("chatroom:update", ({ senderId, chatroom }: ChatroomPusherPayload) => {
        if (senderId === userId) {
          return;
        }
        console.log("pusher chatrooms");
        setChatroom(chatroom);
        // setDbChatroom(chatroom);
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      router.push("/chats");
    }
    
    try {
      const channel = pusherClient.subscribe(channelName);
      channel.bind("message:update", ({ senderId, messages }: MessagePusherPayload) => {
        if (senderId === userId) {
          return;
        }
        console.log("pusher ", messages)
        fetchMessages();
        // setDbChatroom(chatroom);
        setHavePostMessage(true);
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      router.push("/chats");
    }
    // Unsubscribe from pusher events when the component unmounts
    return () => {
      pusherClient.unsubscribe(channelName);
      // pusherClient.unsubscribe(channelName+'-msg');
    };
  }, [chatroomId, router, userId, fetchMessages]);

  useEffect(() => {
    if (!chatroomId) return;
    const fetchDocument = async () => {
      const res = await fetch(`/api/chatrooms/${chatroomId}`);
      if (!res.ok) {
        setChatroom(null);
        router.push("/chats");
        return;
      }
      const data = await res.json();
      setChatroom(data);
      // setDbChatroom(data);
    };
    fetchDocument();
  }, [chatroomId, router]);

  
  useEffect(() => {
    // console.log("FETCH");
    if (!chatroomId) return;
    fetchMessages();
  }, [havePostMessage, fetchMessages, chatroomId]);

  const image = chatroom?.image || "";
  const setImage = (newImage: string) => {
    if (chatroom === null) return;
    setChatroom({
      ...chatroom,
      image: newImage,
    });
  };

  return {
    chatroomId,
    chatroom,
    messages,
    image,
    setImage,
    setMessages,
    setHavePostMessage,
    fetchMessages,
  };
}