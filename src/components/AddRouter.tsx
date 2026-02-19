
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface AddRouterProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AddRouter({ onSuccess, onCancel }: AddRouterProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        host: '',
        port: '8728',
        username: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/routers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add router');
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Add New Router</CardTitle>
                    <CardDescription>Enter your MikroTik router details.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" placeholder="My Router" required value={formData.name} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="host">IP Address</Label>
                                <Input id="host" name="host" placeholder="192.168.88.1" required value={formData.host} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="port">API Port</Label>
                                <Input id="port" name="port" placeholder="8728" type="number" required value={formData.port} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" name="username" placeholder="admin" required value={formData.username} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Connecting...' : 'Add Router'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
