import { NextResponse } from 'next/server';
import { RouterOSAPI } from 'node-routeros';
import { encodeRouterCredentials } from '@/lib/auth-helper';

export async function GET() {
    return NextResponse.json({ message: "Router storage is now client-side." });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, host, port, username, password } = body;

        // Validate input
        if (!host || !username || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const portNum = parseInt(port || '8728');

        // Sanitize host: remove http:// or https:// and trailing slashes
        let cleanHost = host.replace(/^https?:\/\//, '').replace(/\/$/, '');

        // Remove port from host if user added it there (e.g. host:port)
        if (cleanHost.includes(':')) {
            const parts = cleanHost.split(':');
            cleanHost = parts[0];
        }

        // Test connection
        const client = new RouterOSAPI({
            host: cleanHost,
            port: portNum,
            user: username,
            password,
            keepalive: false,
            timeout: 10,
        });

        try {
            await client.connect();
            // If successful, close
            await client.close();
        } catch (connError: any) {
            return NextResponse.json({ error: `Connection failed: ${connError.message}` }, { status: 400 });
        }

        // Instead of saving to DB, return the encoded ID for client-side storage
        const routerConfig = {
            name: name || cleanHost,
            host: cleanHost,
            port: portNum.toString(),
            username,
            password
        };

        const encodedId = encodeRouterCredentials(routerConfig);

        return NextResponse.json({
            id: encodedId,
            ...routerConfig
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to add router' }, { status: 500 });
    }
}
