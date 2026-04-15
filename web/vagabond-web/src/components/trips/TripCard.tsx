import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type Trip } from "@/lib/api";

type TripCardProps = {
  trip: Trip;
};

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

export function TripCard({ trip }: TripCardProps) {
  return (
    <Link href={`/trips/${trip.id}`} className="block">
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardHeader>
          <CardTitle className="line-clamp-1">{trip.name}</CardTitle>
          <CardDescription>Created {formatCreatedAt(trip.created_at)}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="min-h-10 text-sm text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
            {trip.description?.trim() || "No description provided."}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
