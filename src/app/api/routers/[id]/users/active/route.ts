
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RouterOSAPI } from 'node-routeros';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Fetch router credentials
    const router = db.prepare('SELECT * FROM routers WHERE id = ?').get(id) as any;

    if (!router) {
        return NextResponse.json({ error: 'Router not found' }, { status: 404 });
    }

    const client = new RouterOSAPI({
        host: router.host,
        port: router.port,
        user: router.username,
        password: router.password,
        keepalive: false,
        timeout: 10,
    });

    try {
        await client.connect();

        // Fetch active users. 
        // Usually /user/active/print shows system users. 
        // Only Hotspot/PPP have "active" users in a different sense. 
        // The prompt says "active user details", which usually implies system admins logged in 
        // OR Hotspot active users. I'll fetch system active users first as it's active "management" users.
        // If they meant Hotspot, they usually say "Hotspot users".
        // Let's fetch /user/active/print

        const activeUsers = await client.write('/user/active/print');

        await client.close();

        return NextResponse.json(activeUsers);

    } catch (error: any) {
        return NextResponse.json({ error: `Failed to connect: ${error.message}` }, { status: 500 });
    }
}
