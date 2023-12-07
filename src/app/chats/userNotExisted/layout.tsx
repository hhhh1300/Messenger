import { auth } from "@/lib/auth";
import { publicEnv } from "@/lib/env/public";
import { redirect } from "next/navigation";


type Props = {
  children: React.ReactNode;
};

async function ExistedLayout({ children }: Props) {
  const session = await auth();
  // console.log('layout', session);
  if (!session || !session?.user?.id) {
    redirect(publicEnv.NEXT_PUBLIC_BASE_URL);
  }
  return (
    // overflow-hidden for parent to hide scrollbar
    <main className="flex-rows  top-0 flex h-screen w-full overflow-hidden">
      <div className="w-full overflow-y-scroll">{children}</div>
    </main>
  );
}

export default ExistedLayout;
