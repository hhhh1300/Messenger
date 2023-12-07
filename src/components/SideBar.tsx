'use client'

import Image from "next/image";
import { AiFillWechat } from "react-icons/ai"
import { Button } from "@/components/ui/button";
import { Box } from '@mui/material';
import Link from "next/link";

type SideBarProps = {
  avatar: string;
}

export default function SideBar({avatar} : SideBarProps) {

  return (
    <>
      <div className="">
        <div className="flex justify-center">
          <Image src="/messenger.png" alt="messenger icon" width={128} height={128} />
        </div>
        <div className="flex flex-row items-center">
          <AiFillWechat size={81} />
          <span className="ml-3 font-bold text-blue-800 text-3xl">
            Chat
          </span>
        </div>
        <div className="mt-[390px] ml-4 flex flex-row items-center">
          <Box 
            className="rounded-2xl mr-2"
            component="img"
            src={avatar}
            alt="user avatar"
            height={64}
            width={64}
          /> 
          <Link href={`/auth/signout`}>
            <Button
              variant={"ghost"}
              type={"submit"}
              className="hover:bg-slate-200"
            >
              Sign Out
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}