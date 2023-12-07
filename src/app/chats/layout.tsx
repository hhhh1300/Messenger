import ChatBar from "./_components/ChatBar";
import SideBar from "@/components/SideBar";
import { auth } from "@/lib/auth";
import { publicEnv } from "@/lib/env/public";
import { redirect } from "next/navigation";


type Props = {
  children: React.ReactNode;
};

async function ChatsLayout({ children }: Props) {
  const session = await auth();
  // console.log('layout', session);
  if (!session || !session?.user?.id) {
    redirect(publicEnv.NEXT_PUBLIC_BASE_URL);
  }
  return (
    // overflow-hidden for parent to hide scrollbar
    <main className="flex-rows  top-0 flex h-screen w-full overflow-hidden">
      {/* overflow-y-scroll for child to show scrollbar */}
      <nav className="w-2/12 border-r bg-slate-100 pb-10">
        <SideBar avatar={session.user?.image}/>
      </nav>
      <nav className="w-1/3 border-r bg-slate-100 pb-10">
        <ChatBar/>
      </nav>
      {/* overflow-y-scroll for child to show scrollbar */}
      <div className="w-full overflow-y-scroll">{children}</div>
    </main>
  );
}

export default ChatsLayout;
