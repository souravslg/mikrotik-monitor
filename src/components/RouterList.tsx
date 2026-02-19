'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Server, Plus, ExternalLink } from 'lucide-react';
import AddRouter from './AddRouter';
import Link from 'next/link';

interface Router {
    id: string; // Changed to string for encoded credentials
    name: string;
    host: string;
    username: string;
}

export default function RouterList() {
    const [routers, setRouters] = useState<Router[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchRouters = () => {
        setLoading(true);
        try {
            const stored = localStorage.getItem('mikrotik_routers');
            if (stored) {
                setRouters(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load routers from storage", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRouters();
    }, []);

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this router from your browser specific storage?')) return;

        const newRouters = routers.filter(r => r.id !== id);
        setRouters(newRouters);
        localStorage.setItem('mikrotik_routers', JSON.stringify(newRouters));
    };

    const handleAddSuccess = (newRouter: Router) => {
        const updatedRouters = [newRouter, ...routers];
        setRouters(updatedRouters);
        localStorage.setItem('mikrotik_routers', JSON.stringify(updatedRouters));
        setShowAddModal(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Managed Routers</h2>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Router
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : routers.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-lg bg-muted/50">
                    <Server className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No routers connected</h3>
                    <p className="text-muted-foreground mb-4">Add your first MikroTik router to start monitoring.</p>
                    <Button onClick={() => setShowAddModal(true)}>Add Router</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {routers.map((router) => (
                        <Card key={router.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {router.name}
                                </CardTitle>
                                <Server className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{router.host}</div>
                                <p className="text-xs text-muted-foreground">User: {router.username}</p>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(router.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Link href={`/router/${router.id}`}>
                                    <Button variant="outline" size="sm">
                                        <ExternalLink className="h-4 w-4 mr-2" /> Connect
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {showAddModal && (
                <AddRouter
                    onSuccess={handleAddSuccess}
                    onCancel={() => setShowAddModal(false)}
                />
            )}
        </div>
    );
}
