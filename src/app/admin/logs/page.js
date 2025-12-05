import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export default function LogsPage() {
    const logPath = path.join(process.cwd(), 'songsdata', 'debug_log.txt');
    let content = 'Log file not found.';

    if (fs.existsSync(logPath)) {
        content = fs.readFileSync(logPath, 'utf8');
    }

    return (
        <div style={{ background: '#000', color: '#0f0', padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            <h1>Server Debug Logs</h1>
            <hr style={{ borderColor: '#333' }} />
            <pre>{content}</pre>
        </div>
    );
}
