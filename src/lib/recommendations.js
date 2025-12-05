// Vector Recommendation Engine

// 1. Get Song Vector
// Returns a normalized vector [energy, valence, danceability]
export function getSongVector(song) {
    return [
        song.energy || 0.5,
        song.valence || 0.5,
        song.danceability || 0.5
    ];
}

// 2. Get User Taste Vector
// Aggregates history and preferences into a single taste vector
export function getUserVector(history, likedSongs, genreScores) {
    if (!history.length && !likedSongs.length) return [0.5, 0.5, 0.5]; // Default neutral

    let totalEnergy = 0;
    let totalValence = 0;
    let totalDanceability = 0;
    let count = 0;

    // Weight recent history higher
    history.slice(-20).forEach((song, i) => {
        const weight = 1 + (i / 20); // 1.0 to 2.0
        totalEnergy += (song.energy || 0.5) * weight;
        totalValence += (song.valence || 0.5) * weight;
        totalDanceability += (song.danceability || 0.5) * weight;
        count += weight;
    });

    // Add Liked Songs (Strong Signal)
    // Note: We need the full song objects for liked songs. 
    // If we only have IDs, we might need to look them up. 
    // For now, assuming we pass full objects or this is handled upstream.
    // If likedSongs is just IDs, we skip this or need a lookup map.

    return [
        totalEnergy / count,
        totalValence / count,
        totalDanceability / count
    ];
}

// 3. Cosine Similarity
// Returns a score between -1 and 1 (usually 0-1 for positive vectors)
export function calculateSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));

    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
}

// 4. Get Recommendations
export function getRecommendations(userVector, candidates, limit = 10) {
    const scored = candidates.map(song => {
        const songVec = getSongVector(song);
        const similarity = calculateSimilarity(userVector, songVec);
        return { song, score: similarity };
    });

    // Sort by similarity descending
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(item => item.song);
}

// 5. Generate "Made For You" Mix
export function generateMadeForYou(userVector, allSongs, history, likedSongs, followedArtists) {
    // 0. Cold Start Check: If no user data, return empty
    if (history.length === 0 && likedSongs.length === 0 && followedArtists.length === 0) {
        return [];
    }

    // 1. Filter out very recent history (last 20) to avoid immediate repeats
    const recentIds = new Set(history.slice(-20).map(s => s.id));

    // 2. Candidates: All songs not in recent history
    const candidates = allSongs.filter(s => !recentIds.has(s.id));

    // 3. Calculate Max Play Count for Normalization
    const maxPlayCount = Math.max(...allSongs.map(s => s.play_count || 0), 1);

    const scored = candidates.map(song => {
        let score = 0;

        // A. Vector Similarity (50%)
        const songVec = getSongVector(song);
        const similarity = calculateSimilarity(userVector, songVec);
        score += similarity * 0.5;

        // B. Artist Affinity (30%)
        if (followedArtists.includes(song.artist)) {
            score += 0.3;
        }

        // C. Popularity / Play Count (20%)
        const popularity = (song.play_count || 0) / maxPlayCount;
        score += popularity * 0.2;

        // D. Liked Songs Boost (Bonus)
        if (likedSongs.includes(song.id)) {
            score += 0.1; // Small boost to resurface favorites
        }

        return { song, score };
    });

    // 4. Sort and Return Top 20
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 20).map(item => item.song);
}
