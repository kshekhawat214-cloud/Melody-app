"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Heart, User, Disc, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ContextMenu({ position, onClose, song, onAddToPlaylist }) {
    const menuRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!position || !song) return null;

    const handleGoToArtist = () => {
        const primaryArtist = song.artist.split(',')[0].trim();
        router.push(`/artist/${encodeURIComponent(primaryArtist)}`);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{ top: position.y, left: position.x }}
                className="fixed z-[100] bg-[#282828] text-neutral-200 rounded-md shadow-2xl w-56 py-1 border border-white/5 overflow-hidden"
            >
                <div className="px-1">
                    <button
                        onClick={() => { onAddToPlaylist(song); onClose(); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-sm text-sm flex items-center gap-3 transition-colors"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Add to Playlist
                    </button>
                    <button className="w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-sm text-sm flex items-center gap-3 transition-colors">
                        <Heart className="w-4 h-4" />
                        Save to Liked Songs
                    </button>
                    <div className="h-[1px] bg-white/10 my-1 mx-2" />
                    <button
                        onClick={handleGoToArtist}
                        className="w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-sm text-sm flex items-center gap-3 transition-colors"
                    >
                        <User className="w-4 h-4" />
                        Go to Artist
                    </button>
                    <button className="w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-sm text-sm flex items-center gap-3 transition-colors">
                        <Disc className="w-4 h-4" />
                        Go to Album
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
