"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';

export default function CreatePlaylistModal({ onClose }) {
    const [name, setName] = useState('');
    const { createPlaylist } = usePlayer();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        await createPlaylist(name);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 p-8 rounded-xl w-full max-w-md relative border border-white/10 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-white">Create Playlist</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Playlist"
                            className="w-full bg-neutral-800 border border-transparent focus:border-white/20 rounded-md px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none transition-colors"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-white hover:scale-105 transition-transform"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className="px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                        >
                            {isSubmitting ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
