
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const stmt = db.prepare('DELETE FROM routers WHERE id = ?');
        const result = stmt.run(id);

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Router not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete router' }, { status: 500 });
    }
}
