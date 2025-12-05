import { supabase } from './supabase';

export const getSongs = async () => {
    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching songs:', error);
        return [];
    }
    return data;
};

export const languages = [
    { id: 'en', name: 'English', color: 'from-purple-500 to-blue-500' },
    { id: 'hi', name: 'Hindi', color: 'from-green-500 to-emerald-500' },
    { id: 'pa', name: 'Punjabi', color: 'from-orange-500 to-red-500' },
    { id: 'es', name: 'Spanish', color: 'from-red-500 to-orange-500' },
    { id: 'ko', name: 'Korean', color: 'from-pink-500 to-rose-500' },
];

export const genres = [
    { id: 'hindi pop', name: 'Hindi pop' },
    { id: 'bollywood', name: 'Bollywood' },
    { id: 'romantic', name: 'Romantic' },
    { id: 'lo-fi', name: 'Lo-fi' },
    { id: 'punjabi pop', name: 'Punjabi pop' },
    { id: 'pop', name: 'Pop' },
    { id: 'r&b', name: 'R&b' },
    { id: 'edm', name: 'Edm' },
    { id: 'dancehall', name: 'Dancehall' },
    { id: 'rap', name: 'Rap' },
    { id: 'k-pop', name: 'K-pop' },
    { id: 'indie', name: 'Indie' },
];

export const songs = [];
