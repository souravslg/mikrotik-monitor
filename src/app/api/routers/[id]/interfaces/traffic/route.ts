
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
    });

    try {
        await client.connect();

        // 1. Fetch all interfaces first to get their names
        const interfaces = await client.write('/interface/print');

        // 2. Extract names and join them
        // Note: use .map(i => i.name) and join with comma
        // node-routeros might return different structures, but usually it's an array of objects
        if (!interfaces || !Array.isArray(interfaces) || interfaces.length === 0) {
            await client.close();
            return NextResponse.json([]);
        }

        const interfaceNames = interfaces.map((i: any) => i.name).join(',');

        // 3. Monitor traffic for these specific interfaces
        const traffic = await client.write('/interface/monitor-traffic', [`=interface=${interfaceNames}`, '=once=']);

        await client.close();

        return NextResponse.json(traffic);

    } catch (error: any) {
        return NextResponse.json({ error: `Failed to connect: ${error.message}` }, { status: 500 });
    }
}
