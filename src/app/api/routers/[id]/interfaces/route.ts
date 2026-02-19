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

        // Fetch interfaces
        const interfaces = await client.write('/interface/print');

        await client.close();

        return NextResponse.json(interfaces);

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch interfaces' }, { status: 500 });
    }
}
