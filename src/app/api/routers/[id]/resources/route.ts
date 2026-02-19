import { NextResponse } from 'next/server';
import { RouterOSAPI } from 'node-routeros';
import { decodeRouterCredentials } from '@/lib/auth-helper';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const router = decodeRouterCredentials(id);

        if (!router) {
            return NextResponse.json({ error: 'Invalid router credentials' }, { status: 400 });
        }

        const client = new RouterOSAPI({
            host: router.host,
            port: router.port,
            user: router.username,
            password: router.password,
            keepalive: false,
            timeout: 10,
        });

        await client.connect();

        // Fetch system resources
        const resource = await client.write('/system/resource/print');
        const identity = await client.write('/system/identity/print');

        await client.close();

        return NextResponse.json({
            resource: resource[0],
            identity: identity[0]?.name || 'MikroTik',
            model: resource[0]['board-name'],
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch resources' }, { status: 500 });
    }
}
