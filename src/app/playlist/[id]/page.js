"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Clock, ListMusic, ArrowLeft } from 'lucide-react';
import SongRow from '@/components/SongRow';
import ContextMenu from '@/components/ContextMenu';

export default function PlaylistPage() {
    const { id } = useParams();
    const router = useRouter();
    const { playSong, currentSong, isPlaying, likedSongs, toggleLike } = usePlayer();
    const [playlist, setPlaylist] = useState(null);
    const [songs, setSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [contextMenu, setContextMenu] = useState(null);

    useEffect(() => {
        const fetchPlaylist = async () => {
            // 1. Fetch Playlist Details
            const { data: playlistData, error: playlistError } = await supabase
                .from('playlists')
                .select('*')
                .eq('id', id)
                .single();

            if (playlistError) {
                console.error("Error fetching playlist:", playlistError);
                setIsLoading(false);
                return;
            }
            setPlaylist(playlistData);

            // 2. Fetch Songs in Playlist
            const { data: songsData, error: songsError } = await supabase
                .from('playlist_songs')
                .select('song_id, added_at, songs(*)')
                .eq('playlist_id', id)
                .order('added_at', { ascending: true });

            if (songsError) {
                console.error("Error fetching playlist songs:", songsError);
            } else {
                // Flatten the structure
                setSongs(songsData.map(item => ({
                    ...item.songs,
                    added_at: item.added_at
                })));
            }
            setIsLoading(false);
        };

        if (id) fetchPlaylist();
    }, [id]);

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
        // Placeholder
        alert(`Added "${song.title}" to playlist!`);
    };

    if (isLoading) return <div className="p-8 text-white">Loading...</div>;
    if (!playlist) return <div className="p-8 text-white">Playlist not found</div>;

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
                <div className="w-52 h-52 bg-neutral-800 shadow-2xl flex items-center justify-center rounded-lg overflow-hidden">
                    {playlist.cover ? (
                        <img src={playlist.cover} alt={playlist.name} className="w-full h-full object-cover" />
                    ) : (
                        <ListMusic className="w-24 h-24 text-neutral-500" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-white">Playlist</p>
                    <h1 className="text-7xl font-black mt-2 mb-6 text-white">{playlist.name}</h1>
                    <p className="text-neutral-300 font-medium flex items-center gap-1">
                        <span>{songs.length} songs,</span>
                        <span className="text-neutral-400">
                            {Math.floor(songs.reduce((acc, song) => acc + (song.duration || 0), 0) / 60)} min {Math.floor(songs.reduce((acc, song) => acc + (song.duration || 0), 0) % 60)} sec
                        </span>
                    </p>
                </div>
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
                    {songs.map((song, index) => (
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

                    {songs.length === 0 && (
                        <div className="p-12 text-center text-neutral-500">
                            This playlist is empty. Add some songs!
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
