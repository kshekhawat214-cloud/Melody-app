import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Path to the Node.js script
        const scriptPath = path.join(process.cwd(), 'scripts', 'smart_import.js');

        // Spawn the Node.js process
        const nodeProcess = spawn('node', [scriptPath, url], {
            cwd: process.cwd(),
            stdio: 'ignore', // Or 'inherit' for debugging
            detached: true
        });

        nodeProcess.unref();

        return NextResponse.json({
            success: true,
            message: 'Download started! The song will appear in your library shortly.'
        });

    } catch (error) {
        console.error('Download API Error:', error);
        return NextResponse.json({ error: 'Failed to start download' }, { status: 500 });
    }
}
