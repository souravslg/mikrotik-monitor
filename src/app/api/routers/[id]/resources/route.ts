
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

        // Fetch system resources
        const resource = await client.write('/system/resource/print');

        // Fetch identity
        const identity = await client.write('/system/identity/print');

        // Fetch routerboard info
        let routerboard: any[] = [];
        try {
            routerboard = await client.write('/system/routerboard/print');
        } catch (e) {
            // Some devices might not support this or fail
        }

        await client.close();

        return NextResponse.json({
            resource: resource[0],
            identity: identity[0]?.name,
            model: routerboard[0]?.model || resource[0]['board-name'],
        });

    } catch (error: any) {
        return NextResponse.json({ error: `Failed to connect: ${error.message}` }, { status: 500 });
    }
}
