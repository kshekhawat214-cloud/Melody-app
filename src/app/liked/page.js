"use client";

import { usePlayer } from '@/context/PlayerContext';
import { songs as staticSongs } from '@/lib/data';
import { Play, Clock, Heart } from 'lucide-react';

export default function LikedPage() {
    const { playSong, likedSongs, toggleLike, songs: contextSongs } = usePlayer();
    // Fallback to static songs if context songs are empty
    const songs = contextSongs.length > 0 ? contextSongs : staticSongs;

    const mySongs = songs.filter(song => likedSongs.includes(song.id));

    return (
        <div className="p-8">
            <div className="flex items-end gap-6 mb-8">
                <div className="w-52 h-52 bg-gradient-to-br from-indigo-500 to-purple-500 shadow-2xl flex items-center justify-center rounded-lg">
                    <Heart className="w-24 h-24 text-white fill-white" />
                </div>
                <div>
                    <p className="text-sm font-bold uppercase tracking-wider">Playlist</p>
                    <h1 className="text-7xl font-black mt-2 mb-6">Liked Songs</h1>
                    <p className="text-neutral-300 font-medium">
                        {mySongs.length} songs
                    </p>
                </div>
            </div>

            <div className="bg-black/20 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[16px_4fr_3fr_1fr] gap-4 p-4 text-neutral-400 border-b border-white/10 text-sm font-medium uppercase tracking-wider">
                    <span>#</span>
                    <span>Title</span>
                    <span>Album</span>
                    <Clock className="w-4 h-4 justify-self-end" />
                </div>

                <div className="flex flex-col">
                    {mySongs.map((song, index) => (
                        <div
                            key={song.id}
                            className="group grid grid-cols-[16px_4fr_3fr_1fr] gap-4 p-4 hover:bg-white/10 transition-colors items-center rounded-md cursor-pointer"
                            onClick={() => playSong(song)}
                        >
                            <span className="text-neutral-400 group-hover:hidden">{index + 1}</span>
                            <Play className="w-4 h-4 text-white fill-white hidden group-hover:block" />

                            <div className="flex items-center gap-4">
                                <img src={song.cover} alt={song.title} className="w-10 h-10 rounded object-cover" />
                                <div>
                                    <h3 className="font-medium text-white">{song.title}</h3>
                                    <p className="text-sm text-neutral-400 group-hover:text-white transition-colors">{song.artist}</p>
                                </div>
                            </div>

                            <span className="text-neutral-400 group-hover:text-white transition-colors text-sm">{song.album}</span>

                            <div className="justify-self-end flex items-center gap-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                                >
                                    <Heart className="w-4 h-4 fill-current" />
                                </button>
                                <span className="text-neutral-400 text-sm">
                                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                    ))}

                    {mySongs.length === 0 && (
                        <div className="p-12 text-center text-neutral-500">
                            You haven&apos;t liked any songs yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
