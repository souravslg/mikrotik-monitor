
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

        // Fetch DHCP leases
        const leases = await client.write('/ip/dhcp-server/lease/print');

        await client.close();

        return NextResponse.json(leases);

    } catch (error: any) {
        return NextResponse.json({ error: `Failed to connect: ${error.message}` }, { status: 500 });
    }
}
