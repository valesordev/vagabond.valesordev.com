export default function HomePage() {
  return (
    <main className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Vagabond</h1>
        <p className="text-zinc-400 text-sm">
          Self-hosted trip planning for overlanders
        </p>
        <p className="text-zinc-600 text-xs">Map coming in next session 🗺</p>
      </div>
    </main>
  );
}
