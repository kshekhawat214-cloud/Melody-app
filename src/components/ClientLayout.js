"use client";

import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player";
import RightSidebar from "@/components/RightSidebar";
import BottomNav from "@/components/BottomNav";

import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return (
            <main className="h-screen w-full bg-black">
                {children}
            </main>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-black text-white p-2 gap-2">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-[#121212] rounded-lg relative pb-24 md:pb-24 pb-32">
                {children}
            </main>
            <RightSidebar />
            <Player />
            <BottomNav />
        </div>
    );
}
