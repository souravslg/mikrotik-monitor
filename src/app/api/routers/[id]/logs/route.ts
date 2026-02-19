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

        // Fetch last 50 logs
        const logs = await client.write('/log/print');
        // RouterOS returns logs old to new usually. We want recent.
        // If there are many logs, we might want to limit.
        // For now, let's reverse them in code to show newest first.
        const recentLogs = logs.reverse().slice(0, 50);

        await client.close();

        return NextResponse.json(recentLogs);

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
    }
}
