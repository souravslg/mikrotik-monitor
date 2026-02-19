
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RouterOSAPI } from 'node-routeros';

export async function GET() {
    try {
        const routers = db.prepare('SELECT * FROM routers ORDER BY created_at DESC').all();
        // Don't return passwords in plain text if possible, but for management we might need them or just keep them hidden in UI
        // For now, return everything but maybe obscure password? 
        // Actually, we need password to connect later. 
        // We should probably encrypt it at rest, but for this MVP we'll keep it simple as per plan.
        return NextResponse.json(routers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch routers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, host, port, username, password } = body;

        // Validate input
        if (!name || !host || !username || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const portNum = parseInt(port || '8728');

        // Sanitize host: remove http:// or https:// and trailing slashes
        let cleanHost = host.replace(/^https?:\/\//, '').replace(/\/$/, '');

        // Remove port from host if user added it there (e.g. host:port)
        if (cleanHost.includes(':')) {
            const parts = cleanHost.split(':');
            cleanHost = parts[0];
        }

        // Test connection
        const client = new RouterOSAPI({
            host: cleanHost,
            port: portNum,
            user: username,
            password,
            keepalive: false,
            timeout: 10,
        });

        try {
            await client.connect();
            // If successful, close and save
            await client.close();
        } catch (connError: any) {
            return NextResponse.json({ error: `Connection failed: ${connError.message}` }, { status: 400 });
        }

        // Save to DB
        const stmt = db.prepare(
            'INSERT INTO routers (name, host, port, username, password) VALUES (?, ?, ?, ?, ?)'
        );
        const result = stmt.run(name, cleanHost, portNum, username, password);

        return NextResponse.json({
            id: result.lastInsertRowid,
            name,
            host,
            port: portNum,
            username
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to add router' }, { status: 500 });
    }
}
