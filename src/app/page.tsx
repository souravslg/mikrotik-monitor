
import RouterList from '@/components/RouterList';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">MikroTik Monitor</h1>
      </div>

      <div className="w-full max-w-5xl">
        <RouterList />
      </div>
    </main>
  );
}
