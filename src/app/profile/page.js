"use client";

import { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { motion } from 'framer-motion';
import { Music, User, Lock } from 'lucide-react';

export default function ProfilePage() {
    const { user, playlists, followedArtists } = usePlayer();

    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [status, setStatus] = useState({ state: 'idle', message: '', progress: 0, total: 0, addedCount: 0 });

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-neutral-400">
                Please log in to view your profile.
            </div>
        );
    }

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
            if (!data.success) {
                setStatus(prev => ({ ...prev, state: 'error', message: data.error }));
            }
        } catch (err) {
            setStatus(prev => ({ ...prev, state: 'error', message: 'Failed to start.' }));
        }
    };

    // Robust Polling Effect (Synced with Sidebar.js)


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
                        }
                    }

                    setStatus(prev => ({ ...prev, ...data }));

                    if (data.state === 'completed') {
                        // Keep modal open for a bit to show success message
                        setTimeout(() => {
                            // Don't auto-close immediately if user wants to read stats, but here we mirror sidebar
                            setStatus({ state: 'idle', message: '', progress: 0, total: 0, addedCount: 0 });
                            setShowDownloadModal(false);
                            setDownloadUrl('');
                        }, 5000);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showDownloadModal, status.state]);

    return (
        <div className="p-8 space-y-8 pb-32 bg-gradient-to-b from-neutral-900 to-black min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl">
                    <span className="text-5xl md:text-6xl font-bold text-black">
                        {user.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                </div>
                <div className="space-y-2 mb-2 flex-1">
                    <p className="text-sm font-bold uppercase text-neutral-400">Profile</p>
                    <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tight">
                        {user.user_metadata?.full_name || 'Listener'}
                    </h1>
                    <div className="flex flex-col md:flex-row items-center gap-2 text-neutral-300 justify-center md:justify-start">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span className="text-sm">Private Profile • {playlists.length} Playlists • {followedArtists.length} Following</span>
                        </div>
                    </div>

                    {/* Mobile Download Button */}
                    <button
                        onClick={() => setShowDownloadModal(true)}
                        className="md:hidden mt-4 w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-colors"
                    >
                        <Music className="w-5 h-5" />
                        Download Music
                    </button>
                </div>
            </div>

            <div className="h-px bg-white/10 w-full" />

            {/* Private Playlists */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Your Private Playlists</h2>
                {playlists.length === 0 ? (
                    <p className="text-neutral-400">You haven't created any playlists yet.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {playlists.map((playlist) => (
                            <div key={playlist.id} className="bg-neutral-900/40 p-4 rounded-lg hover:bg-neutral-800 transition-colors group cursor-pointer">
                                <div className="aspect-square bg-neutral-800 mb-4 rounded-md overflow-hidden relative shadow-lg">
                                    {playlist.cover ? (
                                        <img src={playlist.cover} alt={playlist.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Music className="w-12 h-12 text-neutral-600" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-white truncate">{playlist.name}</h3>
                                <p className="text-sm text-neutral-400">By {user.user_metadata?.full_name}</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Followed Artists */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Artists You Follow</h2>
                {followedArtists.length === 0 ? (
                    <p className="text-neutral-400">You aren't following any artists yet.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {followedArtists.map((artist) => (
                            <div key={artist} className="bg-neutral-900/40 p-4 rounded-lg hover:bg-neutral-800 transition-colors group cursor-pointer flex flex-col items-center text-center">
                                <div className="w-32 h-32 rounded-full bg-neutral-800 mb-4 overflow-hidden shadow-lg">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${artist}&background=random`}
                                        alt={artist}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="font-bold text-white truncate w-full">{artist}</h3>
                                <p className="text-sm text-neutral-400">Artist</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Download Modal */}
            {showDownloadModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 p-6 rounded-xl w-full max-w-md space-y-4 border border-white/10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">Download Music</h3>
                            <button onClick={() => setShowDownloadModal(false)} className="text-neutral-400 hover:text-white">Close</button>
                        </div>

                        {status.state === 'downloading' || status.state === 'processing' ? (
                            <div className="space-y-4">
                                <div className="text-center font-bold text-primary animate-pulse">
                                    {status.state === 'processing' ? 'Importing...' : 'Downloading...'}
                                </div>
                                <div className="w-full bg-neutral-800 rounded-full h-2">
                                    <div className="bg-primary h-full transition-all" style={{ width: `${(status.progress / (status.total || 1)) * 100}%` }} />
                                </div>
                                <p className="text-center text-sm text-neutral-400">{status.message}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleDownload} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Paste Spotify/YouTube Link"
                                    value={downloadUrl}
                                    onChange={(e) => setDownloadUrl(e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={!downloadUrl}
                                    className="w-full bg-primary text-black font-bold py-3 rounded-full disabled:opacity-50"
                                >
                                    Start Download
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
