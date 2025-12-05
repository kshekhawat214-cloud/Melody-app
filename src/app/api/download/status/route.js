import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const statusPath = path.join(process.cwd(), 'songsdata', 'status.json');

        if (!fs.existsSync(statusPath)) {
            return NextResponse.json({ state: 'idle', message: 'No active download' });
        }

        const statusContent = fs.readFileSync(statusPath, 'utf-8');
        const status = JSON.parse(statusContent);

        // Check if the status is stale (e.g., older than 1 hour)
        // If so, we might consider it idle, but for now let's just return it

        return NextResponse.json(status);

    } catch (error) {
        console.error('Status API Error:', error);
        return NextResponse.json({ error: 'Failed to read status' }, { status: 500 });
    }
}
