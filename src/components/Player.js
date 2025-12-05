"use client";

import { usePlayer } from '@/context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Repeat, Shuffle, ListMusic, Plus, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import ArtistLinks from './ArtistLinks';

export default function Player() {
    const {
        currentSong,
        isPlaying,
        playSong,
        nextSong,
        prevSong,
        toggleLike,
        likedSongs,
        audioRef,
        isShuffle,
        toggleShuffle,
        handleSongEnd,
        handleSongSkip,
        queue,
        playlists,
        addSongToPlaylist,
        isQueueOpen,
        toggleQueue,
        followedArtists,
        toggleFollow
    } = usePlayer();

    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Close full screen on back button
    useEffect(() => {
        const handleBack = () => {
            if (isFullScreen) setIsFullScreen(false);
        };
        if (isFullScreen) {
            window.history.pushState(null, null, window.location.pathname);
            window.addEventListener('popstate', handleBack);
        }
        return () => window.removeEventListener('popstate', handleBack);
    }, [isFullScreen]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            if (audio.duration) {
                setProgress(audio.currentTime);
                setDuration(audio.duration);
            }
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleSongEnd);
        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleSongEnd);
        };
    }, [audioRef, handleSongEnd]);

    const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setProgress(newTime);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!currentSong) return null;

    const isLiked = likedSongs.includes(currentSong.id);

    return (
        <>
            {/* Full Screen Player Overlay */}
            <AnimatePresence>
                {isFullScreen && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 bg-gradient-to-b from-neutral-800 to-black z-[60] flex flex-col md:hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 pt-12 relative">
                            <button onClick={() => setIsFullScreen(false)} className="text-white p-2">
                                <ChevronDown className="w-6 h-6" />
                            </button>
                            <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">Now Playing</span>
                            <button onClick={() => setShowPlaylistMenu(!showPlaylistMenu)} className="text-white p-2">
                                <Plus className="w-6 h-6" />
                            </button>

                            {/* Playlist Menu Dropdown */}
                            {showPlaylistMenu && (
                                <div className="absolute top-full right-4 bg-neutral-800 border border-white/10 rounded-xl shadow-2xl p-2 w-64 z-50 max-h-80 overflow-y-auto">
                                    <h4 className="text-sm font-bold text-white px-3 py-2 mb-1 border-b border-white/5">Add to Playlist</h4>
                                    {playlists.length === 0 ? (
                                        <p className="text-xs text-neutral-400 px-3 py-2">No playlists found.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {playlists.map(playlist => (
                                                <button
                                                    key={playlist.id}
                                                    onClick={async () => {
                                                        await addSongToPlaylist(playlist.id, currentSong.id);
                                                        setShowPlaylistMenu(false);
                                                        // Optional: Add toast notification here
                                                    }}
                                                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-white/10 text-sm text-white transition-colors flex items-center gap-3"
                                                >
                                                    <div className="w-8 h-8 bg-neutral-700 rounded flex-shrink-0 overflow-hidden">
                                                        {playlist.cover ? (
                                                            <img src={playlist.cover} alt={playlist.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ListMusic className="w-4 h-4 text-neutral-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="truncate">{playlist.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="flex flex-col px-6 pb-8 justify-center gap-8 min-h-full pt-4">
                                {/* Cover Art */}
                                <div className="aspect-square w-full shadow-2xl rounded-lg overflow-hidden relative flex-shrink-0">
                                    <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover" />
                                </div>

                                {/* Title & Artist & Like */}
                                <div className="flex items-center justify-between flex-shrink-0">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h2 className="text-2xl font-bold text-white truncate leading-tight">{currentSong.title}</h2>
                                        <p className="text-lg text-neutral-400 truncate block mt-1">
                                            {currentSong.artist.split(',')[0].trim()}
                                        </p>
                                    </div>
                                    <button onClick={() => toggleLike(currentSong.id)} className={cn("transition-colors", isLiked ? "text-green-500" : "text-white")}>
                                        <Heart className={cn("w-7 h-7", isLiked && "fill-current")} />
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2 flex-shrink-0">
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 100}
                                        value={progress}
                                        onChange={handleSeek}
                                        style={{
                                            background: `linear-gradient(to right, white ${(progress / (duration || 1)) * 100}%, #444 ${(progress / (duration || 1)) * 100}%)`
                                        }}
                                        className="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                    />
                                    <div className="flex justify-between text-xs text-neutral-400 font-medium">
                                        <span>{formatTime(progress)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Main Controls */}
                                <div className="flex items-center justify-between flex-shrink-0">
                                    <button onClick={toggleShuffle} className={cn("transition-colors", isShuffle ? "text-green-500" : "text-white")}>
                                        <Shuffle className="w-6 h-6" />
                                    </button>
                                    <button onClick={prevSong} className="text-white hover:scale-110 transition-transform">
                                        <SkipBack className="w-8 h-8 fill-current" />
                                    </button>
                                    <button
                                        onClick={() => playSong(currentSong)}
                                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-8 h-8 text-black fill-black" />
                                        ) : (
                                            <Play className="w-8 h-8 text-black fill-black ml-1" />
                                        )}
                                    </button>
                                    <button onClick={handleSongSkip} className="text-white hover:scale-110 transition-transform">
                                        <SkipForward className="w-8 h-8 fill-current" />
                                    </button>
                                    <button className="text-white transition-colors">
                                        <Repeat className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Bottom Actions */}
                                <div className="flex items-center justify-between px-2 flex-shrink-0">
                                    <button className="text-neutral-400 hover:text-white">
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => { setIsFullScreen(false); toggleQueue(); }} className={cn("transition-colors", isQueueOpen ? "text-green-500" : "text-neutral-400 hover:text-white")}>
                                        <ListMusic className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* About the Artist Section */}
                                <div className="mt-8 bg-neutral-800/50 rounded-lg p-4 space-y-4 flex-shrink-0">
                                    <h3 className="text-lg font-bold text-white">About the artist</h3>
                                    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-700">
                                        {/* Placeholder Artist Image - In real app, fetch from DB */}
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${currentSong.artist.split(',')[0].trim()}&background=random&size=400`}
                                            alt={currentSong.artist.split(',')[0].trim()}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                                            <h4 className="text-xl font-bold text-white">{currentSong.artist.split(',')[0].trim()}</h4>
                                            <p className="text-neutral-300 text-sm">13.6M monthly listeners</p>
                                        </div>
                                    </div>
                                    <p className="text-neutral-400 text-sm line-clamp-3">
                                        {currentSong.artist.split(',')[0].trim()} is one of the most influential artists in the industry, known for their unique style and chart-topping hits.
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => toggleFollow(currentSong.artist.split(',')[0].trim())}
                                            className={cn(
                                                "px-6 py-2 rounded-full font-bold border transition-colors",
                                                followedArtists.includes(currentSong.artist.split(',')[0].trim())
                                                    ? "bg-transparent border-white text-white hover:bg-white/10"
                                                    : "bg-transparent border-neutral-400 text-white hover:border-white"
                                            )}
                                        >
                                            {followedArtists.includes(currentSong.artist.split(',')[0].trim()) ? "Following" : "Follow"}
                                        </button>
                                    </div>
                                </div>

                                {/* Credits Section */}
                                <div className="bg-neutral-800/50 rounded-lg p-4 space-y-4 flex-shrink-0 mb-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white">Credits</h3>
                                        <button className="text-sm font-bold text-white hover:underline">Show all</button>
                                    </div>

                                    <div className="space-y-4">
                                        {currentSong.artist.split(',').map((artistRaw, index) => {
                                            const artist = artistRaw.trim();
                                            return (
                                                <div key={index} className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-white">{artist}</h4>
                                                        <p className="text-sm text-neutral-400">
                                                            {index === 0 ? "Main Artist" : "Artist"}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleFollow(artist)}
                                                        className={cn(
                                                            "px-4 py-1 rounded-full text-sm font-bold border transition-colors",
                                                            followedArtists.includes(artist)
                                                                ? "bg-transparent border-white text-white"
                                                                : "bg-transparent border-neutral-500 text-white"
                                                        )}
                                                    >
                                                        {followedArtists.includes(artist) ? "Following" : "Follow"}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                onClick={() => setIsFullScreen(true)}
                className="fixed bottom-[4.5rem] md:bottom-0 left-2 right-2 md:left-0 md:right-0 h-14 md:h-24 bg-[#282828]/80 md:bg-black/80 border md:border-t border-white/10 md:border-none rounded-lg md:rounded-none backdrop-blur-xl px-2 md:px-6 flex items-center justify-between z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.5)] md:shadow-none cursor-pointer md:cursor-default border-t border-white/5"
            >
                {/* Song Info */}
                <div className="flex items-center gap-3 w-full md:w-[30%] overflow-hidden">
                    <img
                        src={currentSong.cover}
                        alt={currentSong.title}
                        className="w-10 h-10 md:w-14 md:h-14 rounded md:rounded shadow-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 ml-1">
                        <h4 className="font-medium text-white text-sm md:text-base truncate">{currentSong.title}</h4>
                        <ArtistLinks artists={currentSong.artist} className="text-xs md:text-sm text-neutral-400 truncate block" />
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(currentSong.id);
                        }}
                        className={cn("ml-2 transition-colors flex-shrink-0", isLiked ? "text-green-500" : "text-neutral-400 hover:text-white")}
                    >
                        <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                    </button>

                    {/* Mobile Play Button (Only visible on mobile) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            playSong(currentSong);
                        }}
                        className="md:hidden w-8 h-8 bg-transparent flex items-center justify-center flex-shrink-0 ml-1"
                    >
                        {isPlaying ? (
                            <Pause className="w-6 h-6 text-white fill-white" />
                        ) : (
                            <Play className="w-6 h-6 text-white fill-white" />
                        )}
                    </button>
                </div>

                {/* Controls (Hidden on Mobile) */}
                <div className="hidden md:flex flex-col items-center gap-2 w-[40%]">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                            className={cn("transition-colors", isShuffle ? "text-green-500" : "text-neutral-400 hover:text-white")}
                        >
                            <Shuffle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); prevSong(); }}
                            className="text-neutral-400 hover:text-white transition-colors"
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); playSong(currentSong); }}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 text-black fill-black" />
                            ) : (
                                <Play className="w-5 h-5 text-black fill-black ml-1" />
                            )}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleSongSkip(); }} className="text-neutral-400 hover:text-white transition-colors">
                            <SkipForward className="w-5 h-5" />
                        </button>
                        <button onClick={(e) => e.stopPropagation()} className="text-neutral-400 hover:text-white transition-colors">
                            <Repeat className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="w-full max-w-md flex items-center gap-2 text-xs text-neutral-400 font-medium">
                        <span>{formatTime(progress)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={progress}
                            onClick={(e) => e.stopPropagation()}
                            onChange={handleSeek}
                            style={{
                                background: `linear-gradient(to right, white ${(progress / (duration || 1)) * 100}%, #333 ${(progress / (duration || 1)) * 100}%)`
                            }}
                            className="flex-1 h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 transition-all"
                        />
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Volume & Queue (Hidden on Mobile) */}
                <div className="hidden md:flex items-center justify-end gap-3 w-[30%] relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleQueue(); }}
                        className={cn("transition-colors", isQueueOpen ? "text-green-500" : "text-neutral-400 hover:text-white")}
                    >
                        <ListMusic className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 group">
                        <Volume2 className="w-5 h-5 text-neutral-400" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onClick={(e) => e.stopPropagation()}
                            onChange={handleVolumeChange}
                            style={{
                                background: `linear-gradient(to right, white ${volume * 100}%, #333 ${volume * 100}%)`
                            }}
                            className="w-24 h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 transition-all"
                        />
                    </div>
                </div>

                {/* Mobile Progress Bar (Bottom of mini player) */}
                <div className="md:hidden absolute bottom-0 left-2 right-2 h-[2px] bg-transparent overflow-hidden rounded-b-lg">
                    <div
                        className="h-full bg-white transition-all duration-100"
                        style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                    />
                </div>
            </motion.div>
        </>
    );
}
