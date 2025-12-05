import csv
import os
import random

# Heuristics for Audio Features
# Energy: 0.0 (Calm) to 1.0 (Intense)
# Valence: 0.0 (Sad/Dark) to 1.0 (Happy/Positive)
# Danceability: 0.0 (Static) to 1.0 (Danceable)

GENRE_MAP = {
    'pop': {'energy': 0.7, 'valence': 0.7, 'danceability': 0.7},
    'rock': {'energy': 0.8, 'valence': 0.5, 'danceability': 0.5},
    'hip hop': {'energy': 0.7, 'valence': 0.6, 'danceability': 0.8},
    'rap': {'energy': 0.8, 'valence': 0.5, 'danceability': 0.8},
    'jazz': {'energy': 0.4, 'valence': 0.6, 'danceability': 0.5},
    'classical': {'energy': 0.2, 'valence': 0.5, 'danceability': 0.1},
    'electronic': {'energy': 0.8, 'valence': 0.7, 'danceability': 0.8},
    'dance': {'energy': 0.9, 'valence': 0.8, 'danceability': 0.9},
    'r&b': {'energy': 0.5, 'valence': 0.6, 'danceability': 0.6},
    'indie': {'energy': 0.6, 'valence': 0.5, 'danceability': 0.5},
    'folk': {'energy': 0.3, 'valence': 0.5, 'danceability': 0.4},
    'metal': {'energy': 0.9, 'valence': 0.3, 'danceability': 0.4},
    'punk': {'energy': 0.9, 'valence': 0.4, 'danceability': 0.6},
    'country': {'energy': 0.5, 'valence': 0.6, 'danceability': 0.6},
    'reggae': {'energy': 0.6, 'valence': 0.8, 'danceability': 0.7},
    'blues': {'energy': 0.4, 'valence': 0.4, 'danceability': 0.5},
    'soundtrack': {'energy': 0.5, 'valence': 0.5, 'danceability': 0.3},
    'lo-fi': {'energy': 0.3, 'valence': 0.5, 'danceability': 0.4},
    'romantic': {'energy': 0.4, 'valence': 0.7, 'danceability': 0.5},
    'sad': {'energy': 0.2, 'valence': 0.2, 'danceability': 0.2},
    'party': {'energy': 0.9, 'valence': 0.9, 'danceability': 0.9},
}

KEYWORDS = {
    'remix': {'energy': 0.2, 'danceability': 0.2},
    'acoustic': {'energy': -0.3, 'danceability': -0.2},
    'live': {'energy': 0.1},
    'slow': {'energy': -0.3, 'danceability': -0.3},
    'love': {'valence': 0.2},
    'sad': {'valence': -0.4, 'energy': -0.2},
    'happy': {'valence': 0.4, 'energy': 0.2},
}

def get_features(genre, title):
    genre = genre.lower().strip()
    title = title.lower()
    
    # Default
    base = {'energy': 0.5, 'valence': 0.5, 'danceability': 0.5}
    
    # Apply Genre Base
    for key in GENRE_MAP:
        if key in genre:
            base = GENRE_MAP[key].copy()
            break
            
    # Apply Keyword Modifiers
    for key, mods in KEYWORDS.items():
        if key in title:
            for attr, val in mods.items():
                base[attr] = max(0.0, min(1.0, base[attr] + val))
                
    # Add Random Variance (0.0 - 0.1)
    for attr in base:
        base[attr] = max(0.0, min(1.0, base[attr] + random.uniform(-0.05, 0.05)))
        
    return base

csv_path = os.path.join('songsdata', 'songs.csv')
temp_path = os.path.join('songsdata', 'songs_enriched.csv')

try:
    with open(csv_path, 'r', encoding='utf-8') as infile, \
         open(temp_path, 'w', encoding='utf-8', newline='') as outfile:
        
        reader = csv.reader(infile)
        writer = csv.writer(outfile)
        
        headers = next(reader)
        
        # Check if already enriched
        if 'energy' in headers:
            print("CSV already enriched.")
            exit()
            
        new_headers = headers + ['energy', 'valence', 'danceability']
        writer.writerow(new_headers)
        
        for row in reader:
            if not row: continue
            
            # title,artist,url,genre,language
            title = row[0]
            genre = row[3] if len(row) > 3 else "Unknown"
            
            features = get_features(genre, title)
            
            new_row = row + [
                f"{features['energy']:.2f}",
                f"{features['valence']:.2f}",
                f"{features['danceability']:.2f}"
            ]
            writer.writerow(new_row)
            
    print("Enrichment complete. Replacing file...")
    
    # Backup original
    if os.path.exists(csv_path + '.bak'):
        os.remove(csv_path + '.bak')
    os.rename(csv_path, csv_path + '.bak')
    
    # Replace
    os.rename(temp_path, csv_path)
    print("Success!")
    
except Exception as e:
    print(f"Error: {e}")
