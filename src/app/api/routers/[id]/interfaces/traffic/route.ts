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
            timeout: 60, // Significantly increased timeout for Vercel execution
        });

        await client.connect();

        // 1. Fetch all interfaces first
        const interfaces = await client.write('/interface/print');

        // 2. Filter for running interfaces
        const runningInterfaces = interfaces.filter((i: any) => i.running === 'true' || i.name === 'bridge' || i.name.includes('bridge'));

        if (runningInterfaces.length === 0) {
            await client.close();
            return NextResponse.json([]);
        }

        // 3. Construct interface list safely
        // Ensure names are safe. If they contain spaces, usually RouterOS API handles them if passed as a single string argument.
        // However, node-routeros might expect just the string.
        const interfaceNames = runningInterfaces.map((i: any) => i.name).join(',');

        // 4. Monitor traffic
        // Use a try-catch specifically for the monitor command to catch syntax errors
        try {
            const traffic = await client.write('/interface/monitor-traffic', [`=interface=${interfaceNames}`, '=once=']);
            await client.close();
            return NextResponse.json(traffic);
        } catch (cmdError: any) {
            await client.close();
            console.error("Monitor traffic command failed:", cmdError);
            return NextResponse.json({
                error: 'Monitor command failed',
                details: cmdError.message,
                command: `/interface/monitor-traffic =interface=${interfaceNames} =once=`
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Traffic API General Error:", error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch traffic',
            stack: error.stack
        }, { status: 500 });
    }
}
