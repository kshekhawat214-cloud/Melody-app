"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Clock, ListMusic, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import SongRow from '@/components/SongRow';
import ContextMenu from '@/components/ContextMenu';

export default function ArtistPage() {
    const params = useParams();
    const router = useRouter();
    // Decode the artist name from the URL
    const artistName = decodeURIComponent(params.id);

    const { playSong, songs, setQueue, currentSong, isPlaying, followedArtists, toggleFollow, likedSongs, toggleLike } = usePlayer();
    const [artistSongs, setArtistSongs] = useState([]);
    const [contextMenu, setContextMenu] = useState(null); // { x, y, song }

    const isFollowing = followedArtists?.includes(artistName);

    useEffect(() => {
        if (songs.length > 0 && artistName) {
            const filtered = songs.filter(song =>
                song.artist.includes(artistName) || artistName.includes(song.artist)
            );
            setArtistSongs(filtered);
        }
    }, [songs, artistName]);

    const playAll = () => {
        if (artistSongs.length > 0) {
            playSong(artistSongs[0]);
            setQueue(artistSongs.slice(1));
        }
    };

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
        // Placeholder for now
        alert(`Added "${song.title}" to playlist!`);
    };

    if (!artistName) return null;

    // Use the first song's cover as the artist image for now
    const artistImage = artistSongs.length > 0 ? artistSongs[0].cover : null;

    return (
        <div className="p-8 pb-32" onClick={closeContextMenu}>
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="mb-6 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="flex items-end gap-6 mb-8">
                <div className="w-52 h-52 bg-neutral-800 shadow-2xl flex items-center justify-center rounded-full overflow-hidden">
                    {artistImage ? (
                        <img src={artistImage} alt={artistName} className="w-full h-full object-cover" />
                    ) : (
                        <ListMusic className="w-24 h-24 text-neutral-500" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white mb-2">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-[10px]">Verified Artist</span>
                    </div>
                    <h1 className="text-7xl font-black mb-6 text-white">{artistName}</h1>
                    <p className="text-neutral-300 font-medium">
                        {artistSongs.length} songs
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={playAll}
                    className="w-14 h-14 bg-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                >
                    <Play className="w-7 h-7 text-black fill-black ml-1" />
                </button>
                <button
                    onClick={() => toggleFollow(artistName)}
                    className={cn(
                        "px-6 py-2 border rounded-full text-sm font-bold transition-colors uppercase tracking-widest hover:scale-105",
                        isFollowing
                            ? "bg-transparent border-white text-white hover:border-white"
                            : "bg-transparent border-neutral-500 text-white hover:border-white"
                    )}
                >
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
            </div>

            {/* Song List */}
            <div className="bg-black/20 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[16px_4fr_3fr_1fr] gap-4 p-4 text-neutral-400 border-b border-white/10 text-sm font-medium uppercase tracking-wider">
                    <span>#</span>
                    <span>Title</span>
                    <span>Album</span>
                    <Clock className="w-4 h-4 justify-self-end" />
                </div>

                <div className="flex flex-col">
                    {artistSongs.map((song, index) => (
                        <SongRow
                            key={song.id}
                            song={song}
                            index={index}
                            onPlay={playSong}
                            isPlaying={isPlaying}
                            isCurrent={currentSong?.id === song.id}
                            onContextMenu={handleContextMenu}
                            isLiked={likedSongs.includes(song.id)}
                            onLike={() => toggleLike(song.id)}
                        />
                    ))}

                    {artistSongs.length === 0 && (
                        <div className="p-12 text-center text-neutral-500">
                            No songs found for this artist.
                        </div>
                    )}
                </div>
            </div>

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
