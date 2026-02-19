
'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, RefreshCw, Activity, Cpu, HardDrive, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MAX_HISTORY_POINTS = 30; // 30 points * 2s = 60s history

export default function RouterDashboard() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const [resources, setResources] = useState<any>(null);
    const [identity, setIdentity] = useState('');
    const [model, setModel] = useState('');
    const [interfaces, setInterfaces] = useState<any[]>([]);
    const [traffic, setTraffic] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [dhcpLeases, setDhcpLeases] = useState<any[]>([]);
    const [trafficHistory, setTrafficHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchResources = async () => {
        try {
            // Fetch system resources
            const resResource = await fetch(`/api/routers/${id}/resources`);
            if (resResource.ok) {
                const data = await resResource.json();
                setResources(data.resource);
                setIdentity(data.identity);
                setModel(data.model);
            }

            // Fetch interfaces list (static info like MAC, type)
            const resInterfaces = await fetch(`/api/routers/${id}/interfaces`);
            if (resInterfaces.ok) {
                const data = await resInterfaces.json();
                setInterfaces(data);
            }

            // Fetch logs
            const resLogs = await fetch(`/api/routers/${id}/logs`);
            if (resLogs.ok) {
                const data = await resLogs.json();
                setLogs(data);
            }

            // Fetch DHCP leases
            const resLeases = await fetch(`/api/routers/${id}/dhcp/leases`);
            if (resLeases.ok) {
                const data = await resLeases.json();
                setDhcpLeases(data);
            }

            setError('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTraffic = async () => {
        try {
            const resTraffic = await fetch(`/api/routers/${id}/interfaces/traffic`);
            if (resTraffic.ok) {
                const data = await resTraffic.json();
                setTraffic(data);

                // Update history for "bridge" interface
                const bridgeIface =
                    data.find((t: any) => t.name === 'bridge') ||
                    data.find((t: any) => t.name === 'bridge1') ||
                    data.find((t: any) => t.name.includes('bridge'));

                if (bridgeIface) {
                    const tx = parseInt(bridgeIface['tx-bits-per-second']);
                    const rx = parseInt(bridgeIface['rx-bits-per-second']);
                    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

                    setTrafficHistory(prev => {
                        const newHistory = [...prev, { time, tx, rx }];
                        if (newHistory.length > MAX_HISTORY_POINTS) {
                            return newHistory.slice(newHistory.length - MAX_HISTORY_POINTS);
                        }
                        return newHistory;
                    });
                }
            } else {
                // If traffic fetch fails, display it
                const errData = await resTraffic.json();
                console.error("Traffic API Error:", errData);
                // Only set error if it persists to avoid flickering, or use a toast
                // For now, let's just log it to console as user requested, but maybe append to error state if it's persistent
                // setError(`Traffic Error: ${errData.details || errData.error}`); 
            }
        } catch (e: any) {
            console.error("Traffic fetch error", e);
            // setError(`Traffic fetch failed: ${e.message}`);
        }
    };

    useEffect(() => {
        if (id) {
            fetchResources();
        }

        const resourceInterval = setInterval(() => {
            if (id) fetchResources();
        }, 10000); // Resources every 10s

        const trafficInterval = setInterval(() => {
            if (id) fetchTraffic();
        }, 5000); // Traffic every 5s to prevent timeouts in serverless mode

        return () => {
            clearInterval(resourceInterval);
            clearInterval(trafficInterval);
        };
    }, [id]);

    const formatUptime = (uptime: string) => {
        return uptime;
    };

    const formatMemory = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    };

    const formatSpeed = (bps: string | number) => {
        const bits = typeof bps === 'string' ? parseInt(bps) : bps;
        if (isNaN(bits)) return '0 bps';
        if (bits < 1000) return bits + ' bps';
        if (bits < 1000000) return (bits / 1000).toFixed(1) + ' Kbps';
        if (bits < 1000000000) return (bits / 1000000).toFixed(1) + ' Mbps';
        return (bits / 1000000000).toFixed(1) + ' Gbps';
    };

    // Merge traffic data into interfaces
    const getInterfaceTraffic = (name: string) => {
        return traffic.find((t: any) => t.name === name) || {};
    };

    return (
        <main className="flex min-h-screen flex-col p-6 space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="hover:bg-white/10">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        {identity || 'Router Dashboard'}
                    </h1>
                    <p className="text-muted-foreground font-medium">{model} • {resources?.version}</p>
                </div>
                <div className="ml-auto">
                    <Button variant="outline" size="sm" onClick={fetchResources} disabled={loading} className="glass hover:bg-white/20 border-white/10">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl backdrop-blur-sm">
                </div>
            )}

            {/* Debug info for traffic if it failed silently but we caught it in state */}
            {/* We could add a small indicator for API health if needed */}

            {resources && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="glass border-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">CPU Load</CardTitle>
                            <Cpu className="h-4 w-4 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-foreground">{resources['cpu-load']}%</div>
                            <p className="text-xs text-muted-foreground mt-1">{resources['cpu-count']} Core(s) @ {resources['cpu-frequency']}MHz</p>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Memory Usage</CardTitle>
                            <Activity className="h-4 w-4 text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-foreground">
                                {((resources['total-memory'] - resources['free-memory']) / resources['total-memory'] * 100).toFixed(1)}%
                            </div>
                            <div className="w-full bg-secondary/30 h-1.5 mt-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${((resources['total-memory'] - resources['free-memory']) / resources['total-memory'] * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatMemory(resources['total-memory'] - resources['free-memory'])} / {formatMemory(resources['total-memory'])}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">HDD Usage</CardTitle>
                            <HardDrive className="h-4 w-4 text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-foreground">
                                {((resources['total-hdd-space'] - resources['free-hdd-space']) / resources['total-hdd-space'] * 100).toFixed(1)}%
                            </div>
                            <div className="w-full bg-secondary/30 h-1.5 mt-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${((resources['total-hdd-space'] - resources['free-hdd-space']) / resources['total-hdd-space'] * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatMemory(resources['total-hdd-space'] - resources['free-hdd-space'])} / {formatMemory(resources['total-hdd-space'])}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
                            <Clock className="h-4 w-4 text-orange-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-foreground">{formatUptime(resources.uptime)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Board: {resources['board-name']}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Traffic Chart */}
            <Card className="col-span-7 glass border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Bridge Traffic (Real-time)</CardTitle>
                    {trafficHistory.length > 0 && (
                        <div className="flex items-center space-x-4 text-sm font-mono">
                            <div className="flex items-center text-green-400">
                                <ArrowUp className="w-4 h-4 mr-1" />
                                <span>{formatSpeed(trafficHistory[trafficHistory.length - 1].tx)}</span>
                            </div>
                            <div className="flex items-center text-blue-400">
                                <ArrowDown className="w-4 h-4 mr-1" />
                                <span>{formatSpeed(trafficHistory[trafficHistory.length - 1].rx)}</span>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="pl-0">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficHistory}>
                                <defs>
                                    <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" vertical={false} />
                                <XAxis dataKey="time" className="text-xs text-muted-foreground font-medium" tickLine={false} axisLine={false} />
                                <YAxis
                                    className="text-xs text-muted-foreground font-medium"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => formatSpeed(value)}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(8px)',
                                        color: '#fff',
                                        borderRadius: '12px'
                                    }}
                                    formatter={(value: any) => formatSpeed(value)}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="rx"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRx)"
                                    name="Download (RX)"
                                    animationDuration={500}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="tx"
                                    stroke="#22c55e"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTx)"
                                    name="Upload (TX)"
                                    animationDuration={500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
                <Card className="col-span-4 glass border-0">
                    <CardHeader>
                        <CardTitle className="text-lg">Interfaces</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-white/10">
                                    <TableHead className="text-muted-foreground">Name</TableHead>
                                    <TableHead className="hidden md:table-cell text-muted-foreground">Type</TableHead>
                                    <TableHead className="text-muted-foreground">Status</TableHead>
                                    <TableHead className="hidden md:table-cell text-muted-foreground">Mac Address</TableHead>
                                    <TableHead className="text-right text-muted-foreground">TX Rate</TableHead>
                                    <TableHead className="text-right text-muted-foreground">RX Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {interfaces.map((iface: any) => {
                                    const t = getInterfaceTraffic(iface.name);
                                    return (
                                        <TableRow key={iface['.id']} className="hover:bg-white/5 border-white/5 transition-colors">
                                            <TableCell className="font-medium">{iface.name}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">{iface.type}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ring-1 ring-inset ${iface.running === 'true' ? 'bg-green-500/10 text-green-400 ring-green-500/20' : 'bg-gray-500/10 text-gray-400 ring-gray-500/20'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${iface.running === 'true' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                                                    {iface.running === 'true' ? 'Active' : 'Down'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">{iface['mac-address']}</TableCell>
                                            <TableCell className="text-right font-mono text-green-400">
                                                {t['tx-bits-per-second'] ? (
                                                    <div className="flex items-center justify-end">
                                                        <ArrowUp className="w-3 h-3 mr-1" />
                                                        {formatSpeed(t['tx-bits-per-second'])}
                                                    </div>
                                                ) : <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-blue-400">
                                                {t['rx-bits-per-second'] ? (
                                                    <div className="flex items-center justify-end">
                                                        <ArrowDown className="w-3 h-3 mr-1" />
                                                        {formatSpeed(t['rx-bits-per-second'])}
                                                    </div>
                                                ) : <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="col-span-3 glass border-0">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[450px] w-full overflow-auto rounded-xl border border-border/50 bg-muted/50 p-4 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                            {logs.length === 0 ? (
                                <div className="text-center text-muted-foreground text-sm pt-10">No logs found</div>
                            ) : (
                                <div className="space-y-3">
                                    {logs.map((log: any) => (
                                        <div key={log['.id']} className="text-sm border-b border-border/10 pb-3 last:border-0 last:pb-0">
                                            <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-mono">
                                                <span className="opacity-70">{log.time}</span>
                                                <span className="bg-muted px-2 py-0.5 rounded text-xs">{log.topics}</span>
                                            </div>
                                            <p className={`${log.topics && log.topics.includes('error') ? 'text-red-600 dark:text-red-400' : log.topics && log.topics.includes('warning') ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground/90'}`}>
                                                {log.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-4 glass border-0">
                    <CardHeader>
                        <CardTitle className="text-lg">DHCP Leases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-white/10">
                                    <TableHead className="text-muted-foreground">Address</TableHead>
                                    <TableHead className="text-muted-foreground">MAC Address</TableHead>
                                    <TableHead className="text-muted-foreground">Host Name</TableHead>
                                    <TableHead className="text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Last Seen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dhcpLeases.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground p-8">No leases found</TableCell>
                                    </TableRow>
                                ) : (
                                    dhcpLeases.map((lease: any) => (
                                        <TableRow key={lease['.id']} className="hover:bg-white/5 border-white/5 transition-colors">
                                            <TableCell className="font-medium font-mono text-sm">{lease.address}</TableCell>
                                            <TableCell className="text-xs font-mono text-muted-foreground">{lease['mac-address']}</TableCell>
                                            <TableCell>{lease['host-name'] || <span className="text-muted-foreground italic">Unknown</span>}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${lease.status === 'bound' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                    {lease.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">{lease['last-seen']}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
