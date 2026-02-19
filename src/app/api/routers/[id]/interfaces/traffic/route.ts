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

        // 2. Extract names. 
        // Monitor-traffic requires a comma-separated list of names to return data for specific interfaces
        // OR we can just request for all relevant ones.
        // Let's filter for running interfaces to reduce load, or just fetch all.
        // The API command '/interface/monitor-traffic' with 'interface' param taking a list is standard.
        // If we want ALL, we might need to iterate or pass all names.
        // Passing 'all' keyword in api sometimes acts differently than CLI.
        // Best approach: Get names of all interfaces.
        const interfaceNames = interfaces.map((i: any) => i.name).join(',');

        // 3. Monitor traffic once
        const traffic = await client.write('/interface/monitor-traffic', [`=interface=${interfaceNames}`, '=once=']);

        await client.close();

        return NextResponse.json(traffic);

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch traffic' }, { status: 500 });
    }
}
