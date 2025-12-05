# Base image with Node.js (Bookworm includes Python 3.11+)
FROM node:20-bookworm

# Define Build Arguments (so Next.js can see env vars during build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET

# Set as Environment Variables
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY
ENV CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET

# 1. Install System Dependencies (Python, FFmpeg)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 2. Install spotdl and yt-dlp (latest versions) with PEP 668 override for Docker
RUN pip3 install --upgrade spotdl yt-dlp --break-system-packages

# 3. Set Working Directory
WORKDIR /app

# 4. Install Node Dependencies
COPY package*.json ./
RUN npm install

# 5. Copy Source Code
COPY . .

# 6. Build Next.js App
RUN npm run build

# 7. Expose Port
EXPOSE 3000

# 8. Start Command
CMD ["npm", "start"]
