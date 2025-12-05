"use client";

import { usePlayer } from "@/context/PlayerContext";
import { X, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RightSidebar() {
    const { currentSong, queue, isQueueOpen, toggleQueue, playSong } = usePlayer();

    if (!isQueueOpen) return null;

    return (
        <div className="hidden lg:flex w-[350px] bg-[#121212] flex-col h-full rounded-lg ml-2 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
                <h2 className="text-lg font-bold text-white">Queue</h2>
                <div className="flex items-center gap-2">
                    <button onClick={toggleQueue} className="text-neutral-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Now Playing */}
                {currentSong && (
                    <div className="space-y-4">
                        <h3 className="text-white font-bold text-base">Now playing</h3>
                        <div className="group relative rounded-lg overflow-hidden hover:bg-neutral-800/50 p-2 -mx-2 transition-colors">
                            <div className="relative aspect-square w-full mb-4 rounded-md overflow-hidden shadow-lg">
                                <img
                                    src={currentSong.cover}
                                    alt={currentSong.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="text-xl font-bold text-white hover:underline cursor-pointer line-clamp-1">
                                        {currentSong.title}
                                    </h4>
                                    <p className="text-neutral-400 text-sm hover:underline cursor-pointer hover:text-white transition-colors">
                                        {currentSong.artist}
                                    </p>
                                </div>
                                <button className="text-neutral-400 hover:text-white">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Next Up */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-neutral-400 font-bold text-base">Next up</h3>
                        <button className="text-sm text-neutral-400 hover:text-white font-medium hover:underline">
                            Clear list
                        </button>
                    </div>

                    {queue.length > 0 ? (
                        queue.map((song, index) => (
                            <div
                                key={song.id + index}
                                onClick={() => playSong(song)}
                                className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-800 group cursor-pointer transition-colors"
                            >
                                <div className="relative w-10 h-10 flex-shrink-0">
                                    <img
                                        src={song.cover}
                                        alt={song.title}
                                        className="w-full h-full rounded object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded">
                                        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[8px] border-l-white border-b-[4px] border-b-transparent ml-1" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-white text-sm truncate group-hover:text-white">
                                        {song.title}
                                    </h4>
                                    <p className="text-xs text-neutral-400 truncate group-hover:text-white">
                                        {song.artist}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-neutral-500 text-sm py-4">
                            Add songs to queue to see them here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
