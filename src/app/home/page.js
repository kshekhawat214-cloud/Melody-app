"use client";

import { usePlayer } from '@/context/PlayerContext';
import { genres } from '@/lib/data';
import { getRecommendations, getUserVector, generateMadeForYou } from '@/lib/recommendations';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

export default function HomePage() {
    const { playSong, userPreferences, history, likedSongs, songs, isLoading, setQueue, followedArtists, playlists } = usePlayer();
    const [data, setData] = useState({
        madeForYou: [],
        trending: [],
        genreShelves: []
    });
    const [mounted, setMounted] = useState(false);
    const hasLoaded = useRef(false);

    useEffect(() => {
        setMounted(true);

        if (hasLoaded.current) return;
        if (songs.length === 0) return; // Wait for songs to load

        hasLoaded.current = true;

        // 1. Made For You: Removed
        const uniqueMadeForYou = [];

        // 2. Trending
        const allSongsShuffled = [...songs].sort(() => 0.5 - Math.random());

        // 3. Genre Shelves
        const validGenres = genres
            .map(g => ({ ...g, songs: songs.filter(s => s.genre === g.id) }))
            .filter(g => g.songs.length >= 4);

        const randomGenres = validGenres
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);

        setData({
            madeForYou: uniqueMadeForYou,
            trending: allSongsShuffled.slice(0, 6),
            genreShelves: randomGenres.map(g => ({
                ...g,
                songs: g.songs.sort(() => 0.5 - Math.random()).slice(0, 5)
            }))
        });

    }, [songs.length, followedArtists.length, userPreferences.languages.length]); // Only re-run if data loads



    // Determine greeting
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';

    return (
        <div className="p-4 md:p-8 space-y-8 md:space-y-12 pb-32 min-h-screen">
            {/* Good Morning / Greeting Section */}
            <section className="space-y-4 md:space-y-6">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400"
                >
                    {greeting}
                </motion.h2>
            </section>

            {/* Trending Section */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white px-2 md:px-0">Trending Now</h2>
                <div className="flex overflow-x-auto pb-4 gap-4 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible md:pb-0">
                    {data.trending.slice(0, 6).map((song, idx) => (
                        <motion.div
                            key={song.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="group cursor-pointer glass p-3 md:p-4 rounded-xl transition-all min-w-[140px] w-[140px] md:w-auto snap-start hover:shadow-2xl hover:shadow-primary/20"
                            onClick={() => playSong(song)}
                        >
                            <div className="aspect-square mb-3 rounded-lg overflow-hidden relative shadow-lg">
                                <img src={song.cover} alt={song.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <button
                                    className="absolute bottom-2 right-2 w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                                >
                                    <Play className="w-5 h-5 md:w-6 md:h-6 text-black fill-black ml-1" />
                                </button>
                            </div>
                            <h3 className="font-bold truncate text-white text-sm md:text-base">{song.title}</h3>
                            <p className="text-xs md:text-sm text-neutral-400 truncate mt-1">{song.artist}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Genre Shelves */}
            {data.genreShelves.map((genre) => (
                <section key={genre.id} className="space-y-4">
                    <div className="flex items-center justify-between px-2 md:px-0">
                        <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">{genre.name} Mixes</h2>
                    </div>
                    <div className="flex overflow-x-auto pb-4 gap-4 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-5 md:overflow-visible md:pb-0">
                        {genre.songs.map((song, idx) => (
                            <motion.div
                                key={song.id}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                                className="group cursor-pointer glass p-3 md:p-4 rounded-xl transition-all min-w-[140px] w-[140px] md:w-auto snap-start hover:shadow-lg hover:shadow-white/5"
                                onClick={() => playSong(song)}
                            >
                                <div className="aspect-square mb-3 rounded-lg overflow-hidden relative shadow-lg">
                                    <img src={song.cover} alt={song.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <button
                                        className="absolute bottom-2 right-2 w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                                    >
                                        <Play className="w-5 h-5 md:w-6 md:h-6 text-black fill-black ml-1" />
                                    </button>
                                </div>
                                <h3 className="font-medium truncate text-white text-sm">{song.title}</h3>
                                <p className="text-xs text-neutral-400 truncate mt-1">{song.artist}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
