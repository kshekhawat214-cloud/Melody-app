# Base image with Node.js
FROM node:20-bullseye

# 1. Install System Dependencies (Python, FFmpeg)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 2. Install spotdl via pip
RUN pip3 install spotdl

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
