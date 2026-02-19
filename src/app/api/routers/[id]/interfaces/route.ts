
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RouterOSAPI } from 'node-routeros';

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

        // Fetch interfaces
        const interfaces = await client.write('/interface/print');

        await client.close();

        return NextResponse.json(interfaces);

    } catch (error: any) {
        return NextResponse.json({ error: `Failed to connect: ${error.message}` }, { status: 500 });
    }
}
