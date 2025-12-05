"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { getSongs } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { getRecommendations, getUserVector } from '@/lib/recommendations';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [queue, setQueue] = useState([]);
    const [history, setHistory] = useState([]);
    const [likedSongs, setLikedSongs] = useState([]);
    const [isShuffle, setIsShuffle] = useState(false);
    const [songs, setSongs] = useState([]);
    const [playlists, setPlaylists] = useState([]); // Playlist State
    const [isLoading, setIsLoading] = useState(true);
    const [bassBoost, setBassBoost] = useState(false);
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const [user, setUser] = useState(null); // Auth User

    // Audio Context Refs
    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const bassFilterRef = useRef(null);

    // Enhanced Preferences State
    const [userPreferences, setUserPreferences] = useState({
        languages: [],
        genres: [],
        genreScores: {}, // { 'pop': 5, 'rock': 2 }
        playedCounts: {} // { 'songId': 3 }
    });

    const audioRef = useRef(null);

    // Load preferences from LocalStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio();
            audioRef.current.volume = 1;
            audioRef.current.crossOrigin = "anonymous"; // Required for Web Audio API with external sources

            // Initialize Web Audio API
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new AudioContext();
                bassFilterRef.current = audioContextRef.current.createBiquadFilter();
                bassFilterRef.current.type = 'lowshelf';
                bassFilterRef.current.frequency.value = 200; // Hz
                bassFilterRef.current.gain.value = 0; // dB (Default off)

                // Connect nodes: Source -> Filter -> Destination
                // Note: We connect the source later when we are sure the audio element is ready/interacted with
                // to avoid auto-play policy issues or race conditions, but we can try to prep it here.
                // However, createMediaElementSource can only be called once.
                if (!sourceNodeRef.current && audioRef.current instanceof window.Audio) {
                    sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
                    sourceNodeRef.current.connect(bassFilterRef.current);
                    bassFilterRef.current.connect(audioContextRef.current.destination);
                }
            } catch (e) {
                console.error("Web Audio API not supported or failed to init", e);
            }

            const savedPrefs = localStorage.getItem('melody_user_prefs');
            if (savedPrefs) {
                try {
                    setUserPreferences(JSON.parse(savedPrefs));
                } catch (e) {
                    console.error("Failed to parse user prefs", e);
                }
            }

            const savedLikes = localStorage.getItem('melody_liked_songs');
            if (savedLikes) {
                try {
                    setLikedSongs(JSON.parse(savedLikes));
                } catch (e) {
                    console.error("Failed to parse liked songs", e);
                }
            }
        }


        // Fetch songs from DB
        getSongs().then(data => {
            setSongs(data);
            setIsLoading(false);
        });

        // Fetch User & Data
        const initUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                fetchPlaylists(user.id);
                fetchFollowedArtists(user.id);
                fetchLikedSongs(user.id);
            }
        };

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Changed:", event);
            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user);
                fetchPlaylists(session.user.id);
                fetchFollowedArtists(session.user.id);
                fetchLikedSongs(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setPlaylists([]);
                setLikedSongs([]);
                setFollowedArtists([]);
            }
        });

        initUser();

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchLikedSongs = async (userId) => {
        const { data, error } = await supabase
            .from('liked_songs')
            .select('song_id')
            .eq('user_id', userId);
        if (!error && data) {
            setLikedSongs(data.map(item => item.song_id));
        }
    };

    const fetchPlaylists = async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('playlists')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setPlaylists(data || []);
    };

    const createPlaylist = async (name) => {
        if (!user) return null;
        const { data, error } = await supabase
            .from('playlists')
            .insert({
                name,
                cover: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=300&dpr=2&q=80',
                user_id: user.id
            })
            .select()
            .single();

        if (!error && data) {
            setPlaylists(prev => [data, ...prev]);
            return data;
        }
        return null;
    };

    const addSongToPlaylist = async (playlistId, songId) => {
        const { error } = await supabase
            .from('playlist_songs')
            .insert({ playlist_id: playlistId, song_id: songId });

        if (error) {
            console.error("Error adding to playlist:", error);
            return false;
        }
        return true;
    };

    const deletePlaylist = async (playlistId) => {
        const { error } = await supabase
            .from('playlists')
            .delete()
            .eq('id', playlistId);

        if (!error) {
            setPlaylists(prev => prev.filter(p => p.id !== playlistId));
            return true;
        }
        console.error("Error deleting playlist:", error);
        return false;
    };

    // Save preferences whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('melody_user_prefs', JSON.stringify(userPreferences));

        }
    }, [userPreferences]);

    // Save likes to DB (Optimistic Update)
    const toggleLike = async (songId) => {
        if (!user) return;

        const isLiked = likedSongs.includes(songId);
        // Optimistic update
        setLikedSongs(prev => isLiked ? prev.filter(id => id !== songId) : [...prev, songId]);

        if (isLiked) {
            await supabase.from('liked_songs').delete().eq('user_id', user.id).eq('song_id', songId);
        } else {
            await supabase.from('liked_songs').insert({ user_id: user.id, song_id: songId });
        }
    };

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.log("Playback error:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentSong]);

    const updateUserTaste = (song, weight = 1) => {
        setUserPreferences(prev => {
            const newScores = { ...prev.genreScores };
            const newCounts = { ...prev.playedCounts };

            // Increment genre score
            const genre = song.genre;
            newScores[genre] = (newScores[genre] || 0) + weight;

            // Increment song play count
            newCounts[song.id] = (newCounts[song.id] || 0) + 1;

            return {
                ...prev,
                genreScores: newScores,
                playedCounts: newCounts
            };
        });
    };

    // Toggle Bass Boost
    const toggleBassBoost = () => {
        const newState = !bassBoost;
        setBassBoost(newState);
        if (bassFilterRef.current && audioContextRef.current) {
            const currentTime = audioContextRef.current.currentTime;
            // Smooth transition
            bassFilterRef.current.gain.setTargetAtTime(newState ? 12 : 0, currentTime, 0.1);
        }
    };

    const toggleQueue = () => {
        setIsQueueOpen(prev => !prev);
    };

    const playSong = (song) => {
        if (currentSong?.id === song.id) {
            setIsPlaying(!isPlaying);
        } else {
            if (currentSong) {
                setHistory(prev => [...prev, currentSong]);
            }

            // Learn from this play
            updateUserTaste(song);

            if (audioRef.current) {
                audioRef.current.src = song.url;
                audioRef.current.load();

                // Resume AudioContext if suspended (browser policy)
                if (audioContextRef.current?.state === 'suspended') {
                    audioContextRef.current.resume();
                }
            }
            setCurrentSong(song);
            setIsPlaying(true);
        }
    };

    const addToQueue = (song) => {
        setQueue((prev) => [...prev, song]);
    };

    const generateSmartQueue = (current) => {
        console.log("Generating Smart Queue for:", current?.title);
        if (!current) return [];

        // Seed-Based Radio Logic
        const seedVector = [
            current.energy || 0.5,
            current.valence || 0.5,
            current.danceability || 0.5
        ];

        // 1. Filter Candidates
        const recentHistoryIds = new Set(history.slice(-50).map(s => s.id));
        const candidates = songs.filter(s => s.id !== current.id && !recentHistoryIds.has(s.id));

        // 2. Score Candidates based on Seed Match
        const scoredCandidates = candidates.map(s => {
            let score = 0;

            // A. Vector Similarity (50% Weight)
            const sVector = [s.energy || 0.5, s.valence || 0.5, s.danceability || 0.5];
            const dot = seedVector.reduce((acc, val, i) => acc + val * sVector[i], 0);
            const mag1 = Math.sqrt(seedVector.reduce((acc, val) => acc + val * val, 0));
            const mag2 = Math.sqrt(sVector.reduce((acc, val) => acc + val * val, 0));
            const similarity = (mag1 && mag2) ? dot / (mag1 * mag2) : 0;

            score += similarity * 50;

            // B. Genre Match (30% Weight)
            if (s.genre === current.genre) {
                score += 30;
            } else if (s.genre.includes(current.genre) || current.genre.includes(s.genre)) {
                score += 15;
            }

            // C. Language Match (20% Weight)
            if (s.language === current.language) {
                score += 20;
            }

            // D. Continuity Check (Energy Delta Penalty)
            const energyDelta = Math.abs((s.energy || 0.5) - (current.energy || 0.5));
            if (energyDelta > 0.3) {
                score -= 15;
            }

            return { song: s, score };
        });

        // 3. Sort and Pick Top 20
        scoredCandidates.sort((a, b) => b.score - a.score);
        const newQueue = scoredCandidates.slice(0, 20).map(item => item.song);

        console.log("Generated Queue Items:", newQueue.length);
        return newQueue;
    };

    const handleSongEnd = () => {
        if (currentSong) {
            updateUserTaste(currentSong, 2);
        }
        nextSong();
    };

    const handleSongSkip = () => {
        if (currentSong) {
            // updateUserTaste(currentSong, -1);
        }
        nextSong();
    };

    const nextSong = () => {
        if (currentSong) {
            setHistory(prev => [...prev, currentSong]);
        }

        setQueue(prevQueue => {
            let currentQueue = [...prevQueue];

            // If queue is running low, generate more
            if (currentQueue.length <= 1) {
                const seed = currentQueue.length > 0 ? currentQueue[0] : currentSong;
                console.log("Queue low, generating from seed:", seed?.title);
                const newItems = generateSmartQueue(seed);
                currentQueue = [...currentQueue, ...newItems];
            }

            console.log("Processing Next Song. Queue Length:", currentQueue.length);

            if (currentQueue.length > 0) {
                const [next, ...rest] = currentQueue;
                playSong(next);
                return rest;
            } else {
                console.log("Queue Empty in nextSong, using fallback.");
                const recentHistoryIds = new Set(history.slice(-50).map(s => s.id));
                const candidates = songs.filter(s => s.id !== currentSong?.id && !recentHistoryIds.has(s.id));
                const randomNext = candidates[Math.floor(Math.random() * candidates.length)];
                if (randomNext) playSong(randomNext);
                return [];
            }
        });
    };

    const prevSong = () => {
        if (history.length > 0) {
            const previous = history[history.length - 1];
            setHistory(prev => prev.slice(0, -1));
            // Add current back to queue front?
            if (currentSong) {
                setQueue(prev => [currentSong, ...prev]);
            }
            playSong(previous);
        } else {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
            }
        }
    };

    const toggleShuffle = () => {
        setIsShuffle(!isShuffle);
    };

    // toggleLike replaced above

    const [followedArtists, setFollowedArtists] = useState([]); // Array of artist names

    // ... existing useEffect ...

    const fetchFollowedArtists = async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('followed_artists')
            .select('artist_name')
            .eq('user_id', userId);

        if (!error && data) {
            setFollowedArtists(data.map(item => item.artist_name));
        }
    };

    // fetchFollowedArtists called in initUser now

    const toggleFollow = async (artistName) => {
        console.log("Toggling follow for:", artistName);
        const isFollowing = followedArtists.includes(artistName);
        console.log("Current follow state:", isFollowing);

        if (isFollowing) {
            // Unfollow
            console.log("Attempting to unfollow...");
            const { error } = await supabase
                .from('followed_artists')
                .delete()
                .eq('artist_name', artistName)
                .eq('user_id', user.id);

            if (error) {
                console.error("Error unfollowing artist:", error);
            } else {
                console.log("Successfully unfollowed");
                setFollowedArtists(prev => prev.filter(name => name !== artistName));
            }
        } else {
            // Follow
            console.log("Attempting to follow...");
            const { error } = await supabase
                .from('followed_artists')
                .insert({ artist_name: artistName, user_id: user.id });

            if (error) {
                console.error("Error following artist:", error.message, error.details, error.hint, error);
            } else {
                console.log("Successfully followed");
                setFollowedArtists(prev => [...prev, artistName]);
            }
        }
    };

    return (
        <PlayerContext.Provider value={{
            currentSong,
            isPlaying,
            setIsPlaying,
            playSong,
            nextSong,
            prevSong,
            queue,
            addToQueue,
            likedSongs,
            toggleLike,
            userPreferences,
            setUserPreferences,
            isShuffle,
            toggleShuffle,
            audioRef,
            handleSongEnd,
            handleSongSkip,
            history,
            songs,
            isLoading,
            playlists,
            createPlaylist,
            addSongToPlaylist,
            deletePlaylist,
            fetchPlaylists,
            bassBoost,
            toggleBassBoost,
            isQueueOpen,
            toggleQueue,
            setQueue,
            followedArtists,
            followedArtists,
            toggleFollow,
            user
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => useContext(PlayerContext);
