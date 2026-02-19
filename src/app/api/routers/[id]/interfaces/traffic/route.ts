import { NextResponse } from 'next/server';
import { RouterOSAPI } from 'node-routeros';
import { decodeRouterCredentials } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

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

        // 1. Fetch all interfaces first to get their names
        const interfaces = await client.write('/interface/print');

        // 2. Filter for running interfaces to reduce load and avoid issues with disabled ones
        const runningInterfaces = interfaces.filter((i: any) => i.running === 'true' || i.name === 'bridge' || i.name.includes('bridge'));

        if (runningInterfaces.length === 0) {
            await client.close();
            return NextResponse.json([]);
        }

        const interfaceNames = runningInterfaces.map((i: any) => i.name).join(',');

        // 3. Monitor traffic once
        const traffic = await client.write('/interface/monitor-traffic', [`=interface=${interfaceNames}`, '=once=']);

        await client.close();

        return NextResponse.json(traffic);

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch traffic' }, { status: 500 });
    }
}
