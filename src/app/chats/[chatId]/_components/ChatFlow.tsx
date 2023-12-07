"use client";

import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { useChatroom } from "@/hooks/useChatroom";
import { type Message } from "@/lib/types/db";
import { cn } from "@/lib/utils/shadcn";
import { useSession } from "next-auth/react";
import { GrAnnounce } from "react-icons/gr";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

export default function ChatFlow() {
  const router = useRouter();
  const { chatroomId, messages, setHavePostMessage, fetchMessages } = useChatroom();
  const { data: session } = useSession()
  const [ inputValue, setInputValue ] = useState("");
  const userId = session?.user?.id;
  const divRef = useRef<HTMLDivElement>(null);
  const highlightMessage = messages?.find((m) => m.highlight);
  // console.log(messages);
  useEffect(() => {
    divRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages])
  const handleClick = async () => {
    console.log(inputValue);
    try {
      const res = await fetch( `/api/messages/${chatroomId}`, {
        method: "POST",
        body: JSON.stringify({
          content: inputValue, 
          senderId: userId, 
          highlight: false, 
          visible: true
        })
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error);
      }
      setInputValue("");
      setHavePostMessage(true);
      await fetchMessages();
      router.refresh();
      divRef?.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.log(error);
    }
  }

  // const handleRightClick = (e: React.MouseEvent<HTMLSpanElement>, id: string) => {
  //   e.preventDefault();
  //   console.log("handleRightClick");
  //   const x = e.clientX;
  //   const y = e.clientY;
  //   const rightMenu = document.getElementById(id);
  //   console.log(rightMenu);
  //   if (!rightMenu)
  //     return;
  //   rightMenu.style.display = "block";
  //   rightMenu.style.left = x-200+"px";
  //   rightMenu.style.top = y-30+"px";
  //   document.onclick = () => {
  //     rightMenu.style.display = "none";
  //   }
    
  // }
  const handleReturnToSelf = async (message: Message) => {
    console.log("handleReturnToSelf");
    try {
      const res = await fetch( `/api/messages/${chatroomId}`, {
        method: "PUT",
        body: JSON.stringify({
          content: message.content, 
          senderId: message.senderId, 
          highlight: message.highlight, 
          visible: false,
          messageId: message.displayId
        })
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error);
      }
      await fetchMessages();
      router.refresh();
      divRef?.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.log(error);
    }
  }

  const handleDeleteMessage = async (message: Message) => {
    console.log("handleDeleteMessage");
    try {
      const res = await fetch( `/api/messages/${chatroomId}`, {
        method: "DELETE",
        body: JSON.stringify({
          content: message.content, 
          senderId: message.senderId, 
          highlight: message.highlight, 
          visible: message.visible,
          messageId: message.displayId
        })
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error);
      }
      await fetchMessages();
      router.refresh();
      divRef?.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.log(error);
    }
  }

  const handleHighlight = async (message: Message) => {
    console.log("handleHighlight");
    try {
      const res = await fetch( `/api/messages/${chatroomId}`, {
        method: "PUT",
        body: JSON.stringify({
          content: message.content, 
          senderId: message.senderId, 
          highlight: true, 
          visible: message.visible,
          messageId: message.displayId
        })
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error);
      }
      await fetchMessages();
      router.refresh();
      divRef?.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <div className="">
      <div className="overflow-y-scroll p-2 w-full h-[85vh]" id="chatflow">
        {
          highlightMessage && 
          <div className="flex flex-row justify-center fixed top-0 left-3/4 -translate-x-2/4">
            <div className="bg-slate-200 flex flex-row rounded-lg min-w-[10em] text-center">
              <GrAnnounce/>{": "+highlightMessage.content}
            </div>
          </div>
        }
        {
          messages && messages.length > 0 ? 
          messages.map((message, i) => {
            // console.log(message.displayId);
            let isURL = false;
            try {
              new URL(message.content);
              isURL = true;
            } catch (error) {
              isURL = false;
              console.log(message.content, isURL);
            }
            if (message.senderId === userId && !message.visible)
              return (<></>);
            return (
              <>
                <div key={i} className={cn("flex flex-row m-2", message.senderId === userId && "justify-end")}>
                  <span className={cn("rounded-2xl box-content bg-gray-300 px-2 break-normal max-w-[20em]", message.senderId === userId && "bg-blue-300")}>
                    <ContextMenu>
                      <ContextMenuTrigger>
                        { isURL ? <a className="underline" href={`${message.content}`}>{message.content}</a> : message.content}
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        {
                          message.senderId === userId &&
                          <ContextMenuItem onClick={() => handleDeleteMessage(message)}>向所有人收回</ContextMenuItem>
                        }
                        {
                          message.senderId === userId &&
                          <ContextMenuItem onClick={() => handleReturnToSelf(message)}>向自己收回</ContextMenuItem>
                        }
                        <ContextMenuItem onClick={() => handleHighlight(message)}>設為公告</ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </span>
                  {/* <div>
                    <ul className="hidden" id={`span-${i}`}>{getRightMenuButtons()}</ul>
                  </div> */}
                </div> 
              </>
            )
          })
          : <></>
          
        }
        <div ref={divRef}></div>
      </div>
      <div className="flex flex-row px-2 py-2">
        <Input
          placeholder=""
          id="msg"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {if (e.code === "Enter") handleClick();}}
        />
        <Button onClick={handleClick} className="hover:text-yellow-500 ">
          submit
        </Button>
      </div>
    </div>
  );
}

