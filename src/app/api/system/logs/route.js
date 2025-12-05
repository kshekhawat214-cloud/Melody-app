import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (key !== 'antigravity_debug') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const logPath = path.join(process.cwd(), 'songsdata', 'debug_log.txt');

        if (!fs.existsSync(logPath)) {
            return NextResponse.json({ message: 'Log file not found.' });
        }

        const content = fs.readFileSync(logPath, 'utf8');
        return new NextResponse(content, {
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
