"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { Home, Search, Library, Heart, ListMusic, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const navItems = [
    { icon: Home, label: 'Home', href: '/home' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Library, label: 'Your Library', href: '/library' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const playerContext = usePlayer();

    if (!playerContext) {
        return null;
    }

    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [status, setStatus] = useState({ state: 'idle', message: '', progress: 0, total: 0, addedCount: 0 });
    const [isMinimized, setIsMinimized] = useState(false);

    // Poll for status
    useEffect(() => {
        let interval;
        if (showDownloadModal || status.state === 'downloading' || status.state === 'processing') {
            interval = setInterval(async () => {
                try {
                    const res = await fetch('/api/download/status');
                    const data = await res.json();

                    // Ignore stale completion
                    if (data.state === 'completed' && status.state === 'idle') {
                        data.state = 'idle';
                        data.message = '';
                    }

                    // Check for stuck state (no update for > 60s)
                    if ((data.state === 'downloading' || data.state === 'processing') && data.timestamp) {
                        const timeSinceUpdate = Date.now() - data.timestamp;
                        if (timeSinceUpdate > 60000) {
                            data.message = `Process might be stuck (Last update: ${Math.round(timeSinceUpdate / 1000)}s ago). Check logs.`;
                            // Don't change state to error yet, just warn
                        }
                    }

                    setStatus(prev => ({ ...prev, ...data }));

                    if (data.state === 'completed') {
                        // Keep modal open for a bit to show success message
                        setTimeout(() => {
                            setStatus({ state: 'idle', message: '', progress: 0, total: 0, addedCount: 0 });
                            setShowDownloadModal(false);
                            setIsMinimized(false);
                        }, 5000);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showDownloadModal, status.state]);

    const handleDownload = async (e) => {
        e.preventDefault();
        if (!downloadUrl) return;

        setStatus(prev => ({ ...prev, state: 'starting', message: 'Starting download...' }));
        try {
            const res = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: downloadUrl })
            });
            const data = await res.json();
            if (data.success) {
                // Polling will take over
            } else {
                setStatus(prev => ({ ...prev, state: 'error', message: data.error }));
            }
        } catch (err) {
            setStatus(prev => ({ ...prev, state: 'error', message: 'Failed to start.' }));
        }
    };

    const { currentSong } = usePlayer();
    const isDownloading = status.state === 'downloading' || status.state === 'processing';
    const percent = status.total > 0 ? Math.round((status.progress / status.total) * 100) : 0;
    const remaining = status.total - status.progress;

    return (
        <>
            <div className={cn(
                "hidden md:flex w-64 bg-black h-full flex-col p-6 gap-8 border-r border-white/10 relative z-20 transition-all duration-300",
                currentSong ? "pb-32" : "pb-6"
            )}>
                <div className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <ListMusic className="text-black w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Melody</h1>
                </div>

                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors font-medium",
                                    isActive
                                        ? "bg-white/10 text-white"
                                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto space-y-4">
                    {/* User Profile */}
                    {playerContext.user && (
                        <Link href="/profile" className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                                {playerContext.user.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">
                                    {playerContext.user.user_metadata?.full_name || 'Listener'}
                                </p>
                                <p className="text-[10px] text-neutral-400 truncate mb-1">
                                    {playerContext.user.email}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-neutral-400 hover:text-white transition-colors">View Profile</span>
                                    <button
                                        onClick={async (e) => {
                                            e.preventDefault(); // Prevent navigation
                                            const { supabase } = await import('@/lib/supabase');
                                            await supabase.auth.signOut();
                                            window.location.href = '/login';
                                        }}
                                        className="text-xs text-neutral-400 hover:text-red-400 transition-colors flex items-center gap-1"
                                    >
                                        Log out
                                    </button>
                                </div>
                            </div>
                        </Link>
                    )}

                    <button
                        onClick={() => {
                            setShowDownloadModal(true);
                            setIsMinimized(false);
                        }}
                        className="group relative flex items-center gap-4 px-4 py-4 rounded-xl w-full text-left overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {/* Gradient Background */}
                        <div className={cn(
                            "absolute inset-0 transition-opacity duration-500",
                            isDownloading ? "opacity-100 bg-neutral-800" : "bg-gradient-to-r from-primary/20 to-purple-500/20 opacity-0 group-hover:opacity-100"
                        )} />

                        {/* Progress Bar Background */}
                        {isDownloading && (
                            <div
                                className="absolute inset-0 bg-primary/20 transition-all duration-500"
                                style={{ width: `${percent}%` }}
                            />
                        )}

                        <div className="absolute inset-0 border border-white/5 rounded-xl group-hover:border-primary/30 transition-colors duration-300" />

                        <div className="w-10 h-10 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-primary/20 transition-all relative z-10">
                            <Download className={cn("w-5 h-5 transition-colors", isDownloading ? "text-primary animate-pulse" : "text-primary group-hover:text-white")} />
                        </div>
                        <div className="flex flex-col relative z-10">
                            <span className={cn("font-bold transition-colors", isDownloading ? "text-primary" : "text-white group-hover:text-primary")}>
                                {isDownloading ? `${percent}% Completed` : "Download Music"}
                            </span>
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                                {isDownloading ? `${remaining} Remaining` : "Smart Import"}
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Download Modal */}
            {showDownloadModal && !isMinimized && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 p-6 rounded-xl w-full max-w-md space-y-4 border border-white/10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">Download Music</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="text-neutral-400 hover:text-white p-1"
                                    title="Minimize"
                                >
                                    <div className="w-4 h-0.5 bg-current rounded-full" />
                                </button>
                                <button onClick={() => setShowDownloadModal(false)} className="text-neutral-400 hover:text-white p-1">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-neutral-400">
                            Paste a Spotify or YouTube playlist link.
                        </p>

                        {isDownloading ? (
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1 text-xs text-neutral-400">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-white">
                                            {status.state === 'processing' ? 'Importing & Uploading...' : 'Downloading...'}
                                        </span>
                                        <span className="font-mono">{percent}%</span>
                                    </div>
                                    <div className="truncate text-neutral-500" title={status.message}>
                                        {status.message}
                                    </div>
                                </div>
                                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-primary h-full transition-all duration-500"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="bg-neutral-800 p-2 rounded-lg">
                                        <div className="text-xs text-neutral-400">Total</div>
                                        <div className="font-bold">{status.total}</div>
                                    </div>
                                    <div className="bg-neutral-800 p-2 rounded-lg">
                                        <div className="text-xs text-neutral-400">Skipped</div>
                                        <div className="font-bold text-yellow-500">{status.skippedCount || 0}</div>
                                    </div>
                                    <div className="bg-neutral-800 p-2 rounded-lg">
                                        <div className="text-xs text-neutral-400">Done</div>
                                        <div className="font-bold text-primary">{status.progress}</div>
                                    </div>
                                    <div className="bg-neutral-800 p-2 rounded-lg">
                                        <div className="text-xs text-neutral-400">Left</div>
                                        <div className="font-bold text-neutral-300">{remaining}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleDownload} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="https://open.spotify.com/playlist/..."
                                    value={downloadUrl}
                                    onChange={(e) => setDownloadUrl(e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                                    autoFocus
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-primary font-medium">{status.message}</span>
                                    <button
                                        type="submit"
                                        disabled={!downloadUrl || status.state === 'starting'}
                                        className="bg-primary text-black font-bold px-6 py-2 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        Start Download
                                    </button>
                                </div>
                            </form>
                        )}

                        {status.state === 'completed' && (
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-center space-y-1">
                                <div className="text-green-500 font-bold text-lg">Import Complete!</div>
                                <div className="text-sm text-green-400">
                                    Added <span className="font-bold">{status.addedCount || 0}</span> new songs to your library.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
