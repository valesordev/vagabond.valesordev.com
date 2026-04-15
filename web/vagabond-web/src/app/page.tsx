import Map from "@/components/Map";

export default function HomePage() {
  return (
    <main className="h-screen w-full">
      <Map initialCenter={[-117.1611, 32.7157]} initialZoom={8} />
    </main>
  );
}
