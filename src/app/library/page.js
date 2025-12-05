"use client";

import Link from 'next/link';
import { Heart, Plus, Music, ListMusic, Trash2 } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useState } from 'react';
import CreatePlaylistModal from '@/components/CreatePlaylistModal';
import { cn } from '@/lib/utils';

export default function LibraryPage() {
  const { playlists, deletePlaylist, followedArtists } = usePlayer();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'playlists', 'artists', 'albums'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'

  const FilterChip = ({ label, value }) => (
    <button
      onClick={() => setFilter(value)}
      className={cn(
        "px-3 py-1 rounded-full text-sm font-medium transition-colors",
        filter === value
          ? "bg-white text-black"
          : "bg-neutral-800 text-white hover:bg-neutral-700"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 pb-32">
      {/* Header & Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Your Library</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded hover:bg-white/10", viewMode === 'grid' ? "text-white" : "text-neutral-500")}
            >
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="bg-current rounded-[1px]" />
                <div className="bg-current rounded-[1px]" />
                <div className="bg-current rounded-[1px]" />
                <div className="bg-current rounded-[1px]" />
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded hover:bg-white/10", viewMode === 'list' ? "text-white" : "text-neutral-500")}
            >
              <ListMusic className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white ml-2"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <FilterChip label="All" value="all" />
          <FilterChip label="Playlists" value="playlists" />
          <FilterChip label="Artists" value="artists" />
          <FilterChip label="Albums" value="albums" />
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "gap-6",
        viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5" : "flex flex-col"
      )}>
        {/* Liked Songs */}
        {(filter === 'all' || filter === 'playlists') && (
          <Link href="/liked" className={cn(
            "group cursor-pointer hover:bg-white/5 rounded-md transition-colors",
            viewMode === 'list' ? "flex items-center gap-4 p-2" : ""
          )}>
            <div className={cn(
              "bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform",
              viewMode === 'grid' ? "aspect-square mb-4 rounded-lg" : "w-12 h-12 rounded flex-shrink-0"
            )}>
              <Heart className={cn("text-white fill-white", viewMode === 'grid' ? "w-12 h-12" : "w-6 h-6")} />
            </div>
            <div>
              <h3 className={cn("font-bold text-white truncate", viewMode === 'list' ? "text-base" : "")}>Liked Songs</h3>
              <p className="text-sm text-neutral-400">Auto-generated • {243} songs</p>
            </div>
          </Link>
        )}

        {/* Create Playlist Card (Grid Only) */}
        {viewMode === 'grid' && (
          <div
            onClick={() => setShowCreateModal(true)}
            className="group cursor-pointer"
          >
            <div className="aspect-square mb-4 bg-neutral-800/50 border-2 border-dashed border-neutral-700 rounded-lg flex items-center justify-center shadow-lg group-hover:border-white group-hover:bg-neutral-800 transition-all">
              <Plus className="w-12 h-12 text-neutral-500 group-hover:text-white" />
            </div>
            <h3 className="font-bold truncate text-white">Create Playlist</h3>
            <p className="text-sm text-neutral-400">New Playlist</p>
          </div>
        )}

        {/* User Playlists */}
        {(filter === 'all' || filter === 'playlists') && playlists && playlists.map((playlist) => (
          <div key={playlist.id} className={cn(
            "group relative cursor-pointer hover:bg-white/5 rounded-md transition-colors",
            viewMode === 'list' ? "flex items-center gap-4 p-2" : ""
          )}>
            <Link href={`/playlist/${playlist.id}`} className={cn("flex-1", viewMode === 'list' ? "flex items-center gap-4" : "")}>
              <div className={cn(
                "bg-neutral-800 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden",
                viewMode === 'grid' ? "aspect-square mb-4 rounded-lg" : "w-12 h-12 rounded flex-shrink-0"
              )}>
                {playlist.cover ? (
                  <img src={playlist.cover} alt={playlist.name} className="w-full h-full object-cover" />
                ) : (
                  <ListMusic className={cn("text-neutral-600", viewMode === 'grid' ? "w-12 h-12" : "w-6 h-6")} />
                )}
              </div>
              <div>
                <h3 className={cn("font-bold text-white truncate", viewMode === 'list' ? "text-base" : "")}>{playlist.name}</h3>
                <p className="text-sm text-neutral-400">Playlist • By You</p>
              </div>
            </Link>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePlaylist(playlist.id);
              }}
              className={cn(
                "text-neutral-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100",
                viewMode === 'grid' ? "absolute top-2 right-2 p-2 bg-black/50 rounded-full" : "p-2"
              )}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Followed Artists */}
        {(filter === 'all' || filter === 'artists') && followedArtists && followedArtists.map((artistName) => (
          <div key={artistName} className={cn(
            "group relative cursor-pointer hover:bg-white/5 rounded-md transition-colors",
            viewMode === 'list' ? "flex items-center gap-4 p-2" : ""
          )}>
            <Link href={`/artist/${encodeURIComponent(artistName)}`} className={cn("flex-1", viewMode === 'list' ? "flex items-center gap-4" : "")}>
              <div className={cn(
                "bg-neutral-800 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden",
                viewMode === 'grid' ? "aspect-square mb-4 rounded-full" : "w-12 h-12 rounded-full flex-shrink-0"
              )}>
                <img
                  src={`https://ui-avatars.com/api/?name=${artistName}&background=random&size=400`}
                  alt={artistName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className={viewMode === 'grid' ? "text-center" : ""}>
                <h3 className={cn("font-bold text-white truncate", viewMode === 'list' ? "text-base" : "")}>{artistName}</h3>
                <p className="text-sm text-neutral-400">Artist</p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {showCreateModal && <CreatePlaylistModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
