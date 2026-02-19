
export function encodeRouterCredentials(router: { host: string; port: string; username: string; password: string; name?: string }): string {
    const data = JSON.stringify({
        h: router.host,
        p: router.port,
        u: router.username,
        pw: router.password,
        n: router.name // optional, but helpful to keep in the token if needed, though mostly for UI
    });
    return Buffer.from(data).toString('base64');
}

export function decodeRouterCredentials(token: string): { host: string; port: number; username: string; password: string; name?: string } | null {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const data = JSON.parse(decoded);
        return {
            host: data.h,
            port: parseInt(data.p),
            username: data.u,
            password: data.pw,
            name: data.n
        };
    } catch (e) {
        return null;
    }
}
