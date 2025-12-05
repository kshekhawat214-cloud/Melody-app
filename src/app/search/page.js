"use client";

import { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Search as SearchIcon, Play, Mic2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import SongRow from '@/components/SongRow';
import ContextMenu from '@/components/ContextMenu';

import { genres } from '@/lib/data';

export default function SearchPage() {
    const { playSong, songs, isLoading, setQueue, likedSongs, toggleLike } = usePlayer();
    const [query, setQuery] = useState('');
    const router = useRouter();
    const [contextMenu, setContextMenu] = useState(null);

    const handleContextMenu = (e, song) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            song
        });
    };

    const closeContextMenu = () => setContextMenu(null);

    const handleAddToPlaylist = (song) => {
        alert(`Added "${song.title}" to playlist!`);
    };

    // Filter songs based on query
    const filteredSongs = query
        ? songs.filter(song =>
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.artist.toLowerCase().includes(query.toLowerCase()) ||
            (song.genre && song.genre.toLowerCase().includes(query.toLowerCase())) ||
            (song.lyrics && song.lyrics.toLowerCase().includes(query.toLowerCase()))
        )
        : [];

    // Group results
    const topResult = filteredSongs.length > 0 ? filteredSongs[0] : null;
    const otherSongs = filteredSongs.slice(1);

    // Combine genres for "Browse All"
    const browseCategories = genres.map((genre, i) => ({
        ...genre,
        type: 'Genre',
        color: getDeterministicColor(i)
    }));

    function getDeterministicColor(index) {
        const colors = [
            'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500',
            'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
            'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
            'bg-pink-500', 'bg-rose-500'
        ];
        return colors[index % colors.length];
    }

    // Artist Mixes Logic
    const artistMap = {};
    songs.forEach(song => {
        const primaryArtist = song.artist.split(',')[0].trim();
        if (!artistMap[primaryArtist]) artistMap[primaryArtist] = [];
        artistMap[primaryArtist].push(song);
    });

    const validArtists = Object.keys(artistMap)
        .filter(artist => artistMap[artist].length >= 3)
        .map(artist => ({
            id: `artist-${artist}`,
            name: `This Is ${artist}`,
            description: `All the hits from ${artist}`,
            cover: artistMap[artist][0].cover,
            songs: artistMap[artist],
            artistName: artist
        }));

    const randomArtistMixes = validArtists.sort(() => 0.5 - Math.random()).slice(0, 5);

    const handleArtistClick = (artistName) => {
        router.push(`/artist/${encodeURIComponent(artistName)}`);
    };

    return (
        <div className="p-8 space-y-8 pb-32">
            {/* Search Bar */}
            <div className="sticky top-0 z-40 bg-black/50 backdrop-blur-md py-4 -mx-8 px-8">
                <div className="relative max-w-md">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-800 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="What do you want to listen to?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-white rounded-full py-3 pl-12 pr-10 text-black placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white transition-all font-medium"
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-800 hover:text-black"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Search Results */}
            {query ? (
                <div className="space-y-8">
                    {filteredSongs.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {/* Top Result */}
                            <div className="lg:col-span-2 space-y-4">
                                <h2 className="text-2xl font-bold">Top Result</h2>
                                <div
                                    onClick={() => playSong(topResult)}
                                    className="bg-neutral-900/60 p-6 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer group relative overflow-hidden"
                                >
                                    <img
                                        src={topResult.cover}
                                        alt={topResult.title}
                                        className="w-32 h-32 rounded-md shadow-lg mb-4 object-cover"
                                    />
                                    <h3 className="text-3xl font-bold mb-1 line-clamp-1">{topResult.title}</h3>
                                    <p className="text-neutral-400 font-medium mb-4">{topResult.artist}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-neutral-800 text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold">Song</span>
                                        {topResult.lyrics && topResult.lyrics.toLowerCase().includes(query.toLowerCase()) && (
                                            <span className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                                <Mic2 className="w-3 h-3" /> Lyric Match
                                            </span>
                                        )}
                                    </div>

                                    {/* Play Button */}
                                    <div className="absolute bottom-4 right-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        <Play className="w-6 h-6 text-black fill-black ml-1" />
                                    </div>
                                </div>
                            </div>

                            {/* Songs List */}
                            <div className="lg:col-span-3 space-y-4">
                                <h2 className="text-2xl font-bold">Songs</h2>
                                <div className="space-y-2">
                                    {otherSongs.slice(0, 6).map((song, index) => (
                                        <SongRow
                                            key={song.id}
                                            song={song}
                                            index={index}
                                            onPlay={playSong}
                                            isPlaying={false} // Search results don't show playing state usually unless we check global state
                                            isCurrent={false}
                                            onContextMenu={handleContextMenu}
                                            showAlbum={false} // Compact view for search
                                            isLiked={likedSongs.includes(song.id)}
                                            onLike={() => toggleLike(song.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <h3 className="text-2xl font-bold mb-2">No results found for "{query}"</h3>
                            <p className="text-neutral-400">Please make sure your words are spelled correctly, or use less or different keywords.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Browse All Section */
                <div className="space-y-12">
                    {/* Artist Mixes */}
                    {/* Artist Mixes */}
                    {randomArtistMixes.length > 0 && (
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold">Your Top Artists</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {randomArtistMixes.map((mix) => (
                                    <div
                                        key={mix.id}
                                        className="group cursor-pointer bg-neutral-900/20 p-4 rounded-lg hover:bg-neutral-800 transition-colors"
                                        onClick={() => handleArtistClick(mix.artistName)}
                                    >
                                        <div className="aspect-square mb-4 rounded-full overflow-hidden relative shadow-lg">
                                            <img src={mix.cover} alt={mix.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                            <button
                                                className="absolute bottom-2 right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                                            >
                                                <Play className="w-6 h-6 text-black fill-black ml-1" />
                                            </button>
                                        </div>
                                        <h3 className="font-bold truncate text-white text-center">{mix.name}</h3>
                                        <p className="text-xs text-neutral-400 truncate mt-1 text-center">Artist Mix</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Browse All</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {browseCategories.map((category, idx) => (
                                <motion.div
                                    key={category.id + idx}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={cn(
                                        "aspect-square rounded-xl p-4 relative overflow-hidden cursor-pointer shadow-lg transition-all",
                                        category.color || "bg-neutral-800"
                                    )}
                                    onClick={() => setQuery(category.name)} // Quick search by category
                                >
                                    <h3 className="text-2xl font-bold text-white break-words max-w-[100%] absolute top-4 left-4 z-10">
                                        {category.name}
                                    </h3>
                                    {/* Decorative rotated image/icon placeholder */}
                                    <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-black/20 rotate-[25deg] rounded-lg shadow-xl" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div >
            )}
            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    position={{ x: contextMenu.x, y: contextMenu.y }}
                    onClose={closeContextMenu}
                    song={contextMenu.song}
                    onAddToPlaylist={handleAddToPlaylist}
                />
            )}
        </div>
    );
}
