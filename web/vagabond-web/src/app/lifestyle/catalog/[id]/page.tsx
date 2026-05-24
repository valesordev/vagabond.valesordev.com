"use client";

import { useParams } from "next/navigation";

import { LocationDetailScreen } from "@/features/lifestyle/catalog/LocationDetailScreen";

export default function LocationDetailPage() {
  const params = useParams<{ id: string }>();
  return <LocationDetailScreen locId={params.id} />;
}
