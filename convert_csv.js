const fs = require('fs');
const path = require('path');

const csvPath = path.join(process.cwd(), 'songsdata', 'songs.csv');
const outputPath = path.join(process.cwd(), 'src', 'lib', 'data.js');

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim() !== '');

const headers = lines[0].split(','); // title,artist,url,genre,language

// Helper to parse CSV line with quotes
function parseCSVLine(text) {
    const result = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell.trim());
    return result;
}

const songs = [];
const allGenres = new Set();
const allLanguages = new Set();

// Placeholder covers
const covers = [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&dpr=2&q=80',
    'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&dpr=2&q=80',
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&dpr=2&q=80',
    'https://images.unsplash.com/photo-1619983081563-430f63602796?w=300&dpr=2&q=80',
    'https://images.unsplash.com/photo-1514525253440-b393332569ca?w=300&dpr=2&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&dpr=2&q=80',
    'https://images.unsplash.com/photo-1459749411177-287ce3276916?w=300&dpr=2&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&dpr=2&q=80'
];

for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 3) continue;

    const title = cols[0].replace(/^"|"$/g, '');
    const artist = cols[1].replace(/^"|"$/g, '');
    let url = cols[2].replace(/^"|"$/g, '');
    let genreStr = cols[3] ? cols[3].replace(/^"|"$/g, '') : 'Unknown';
    let language = cols[4] ? cols[4].replace(/^"|"$/g, '') : 'Unknown';

    // New Audio Features
    let energy = cols[5] ? parseFloat(cols[5]) : 0.5;
    let valence = cols[6] ? parseFloat(cols[6]) : 0.5;
    let danceability = cols[7] ? parseFloat(cols[7]) : 0.5;

    // Fix URL: Extract filename and prepend /music/
    // Handle both forward and backward slashes
    const filename = url.split(/[\\/]/).pop();
    const cleanUrl = `/music/${filename}`;

    // Process Genre
    const genreList = genreStr.split(',').map(g => g.trim().toLowerCase());
    const primaryGenre = genreList[0] || 'pop';
    allGenres.add(primaryGenre);

    // Infer Language if Unknown
    if (language === 'Unknown') {
        if (genreList.includes('bollywood') || genreList.includes('hindi pop')) language = 'Hindi';
        else if (genreList.includes('punjabi pop') || genreList.includes('bhangra')) language = 'Punjabi';
        else if (genreList.includes('tamil pop')) language = 'Tamil';
        else if (genreList.includes('telugu pop')) language = 'Telugu';
        else if (genreList.includes('gujarati pop')) language = 'Gujarati';
        else if (genreList.includes('bengali pop') || genreList.includes('bangla pop')) language = 'Bengali';
        else language = 'English'; // Default
    }

    // Normalize Language Code
    let langCode = 'en';
    const l = language.toLowerCase();
    if (l.includes('hindi')) langCode = 'hi';
    else if (l.includes('punjabi')) langCode = 'pa';
    else if (l.includes('tamil')) langCode = 'ta';
    else if (l.includes('telugu')) langCode = 'te';
    else if (l.includes('bengali')) langCode = 'bn';
    else if (l.includes('gujarati')) langCode = 'gu';
    else if (l.includes('spanish')) langCode = 'es';
    else if (l.includes('korean')) langCode = 'ko';

    allLanguages.add(language);

    songs.push({
        id: (i).toString(),
        title,
        artist,
        album: 'Single',
        cover: covers[i % covers.length],
        duration: 0, // Will be loaded by player
        language: langCode,
        genre: primaryGenre,
        energy,
        valence,
        danceability,
        lyrics: "",
        url: cleanUrl
    });
}

// Generate File Content
const fileContent = `export const languages = [
    { id: 'en', name: 'English', color: 'from-purple-500 to-blue-500' },
    { id: 'hi', name: 'Hindi', color: 'from-green-500 to-emerald-500' },
    { id: 'pa', name: 'Punjabi', color: 'from-orange-500 to-red-500' },
    { id: 'ta', name: 'Tamil', color: 'from-yellow-500 to-orange-500' },
    { id: 'te', name: 'Telugu', color: 'from-teal-500 to-cyan-500' },
    { id: 'bn', name: 'Bengali', color: 'from-rose-500 to-pink-500' },
    { id: 'gu', name: 'Gujarati', color: 'from-yellow-400 to-amber-500' },
    { id: 'es', name: 'Spanish', color: 'from-red-500 to-orange-500' },
    { id: 'ko', name: 'Korean', color: 'from-pink-500 to-rose-500' },
];

export const genres = [
    ${Array.from(allGenres).map(g => `{ id: '${g}', name: '${g.charAt(0).toUpperCase() + g.slice(1)}' }`).join(',\n    ')}
];

export const songs = ${JSON.stringify(songs, null, 4)};
`;

fs.writeFileSync(outputPath, fileContent);
console.log('Successfully generated data.js with ' + songs.length + ' songs.');
