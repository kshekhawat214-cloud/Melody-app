"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { icon: Home, label: 'Home', href: '/home' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Library, label: 'Library', href: '/library' },
    { icon: User, label: 'Profile', href: '/profile' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent h-20 flex items-center justify-around z-40 md:hidden pb-2 pt-4">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center gap-1 p-2 group"
                    >
                        <Icon className={cn("w-6 h-6 transition-colors", isActive ? "text-white fill-white" : "text-neutral-400 group-hover:text-white")} />
                        <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-white" : "text-neutral-400 group-hover:text-white")}>{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
