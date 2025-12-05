import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ArtistLinks({ artists, className }) {
    if (!artists) return null;

    // Split by comma, but handle potential spacing issues
    const artistList = artists.split(',').map(a => a.trim());

    return (
        <span className={cn("truncate", className)}>
            {artistList.map((artist, index) => (
                <span key={index}>
                    <Link
                        href={`/artist/${encodeURIComponent(artist)}`}
                        className="hover:underline hover:text-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {artist}
                    </Link>
                    {index < artistList.length - 1 && ", "}
                </span>
            ))}
        </span>
    );
}
