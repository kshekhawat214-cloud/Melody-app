"use client";

import { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import ArtistLinks from './ArtistLinks';

export default function SongRow({
    song,
    index,
    onPlay,
    isPlaying,
    isCurrent,
    onContextMenu,
    isLiked = false,
    onLike,
    showAlbum = true,
    showDateAdded = false
}) {
    const [isHovered, setIsHovered] = useState(false);

    const handleContextMenu = (e) => {
        e.preventDefault();
        onContextMenu(e, song);
    };

    return (
        <div
            className={cn(
                "group grid gap-4 p-2 rounded-md hover:bg-white/10 transition-colors items-center cursor-pointer text-sm text-neutral-400",
                showAlbum ? "grid-cols-[16px_4fr_3fr_1fr]" : "grid-cols-[16px_1fr_auto]"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onContextMenu={handleContextMenu}
            onClick={() => onPlay(song)}
        >
            {/* Index / Play Button */}
            <div className="flex justify-center w-4">
                {isCurrent && isPlaying ? (
                    <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" alt="Playing" className="w-3 h-3" />
                ) : isCurrent ? (
                    <span className="text-green-500 font-bold">{index + 1}</span>
                ) : isHovered ? (
                    <Play className="w-3 h-3 text-white fill-white" />
                ) : (
                    <span className="font-medium">{index + 1}</span>
                )}
            </div>

            {/* Title & Artist */}
            <div className="flex items-center gap-4 min-w-0">
                <img src={song.cover} alt={song.title} className="w-10 h-10 rounded object-cover shadow-sm" />
                <div className="flex-1 min-w-0">
                    <h3 className={cn("font-medium truncate", isCurrent ? "text-green-500" : "text-white")}>
                        {song.title}
                    </h3>
                    <div className="text-xs group-hover:text-white transition-colors truncate text-neutral-400">
                        <ArtistLinks artists={song.artist} />
                    </div>
                </div>
            </div>

            {/* Album */}
            {showAlbum && (
                <span className="group-hover:text-white transition-colors truncate">
                    {song.album || 'Single'}
                </span>
            )}

            {/* Duration & Actions */}
            <div className="flex items-center justify-end gap-4">
                <button
                    className={cn(
                        "opacity-0 group-hover:opacity-100 transition-all hover:scale-110",
                        isLiked ? "text-primary opacity-100" : "text-neutral-400 hover:text-white"
                    )}
                    title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
                    onClick={(e) => {
                        e.stopPropagation();
                        onLike(song);
                    }}
                >
                    <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                </button>
                <span className="font-variant-numeric tabular-nums">
                    {Math.floor((song.duration || 0) / 60)}:{((song.duration || 0) % 60).toString().padStart(2, '0')}
                </span>
                <button
                    className="opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                    onClick={(e) => { e.stopPropagation(); onContextMenu(e, song); }}
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
