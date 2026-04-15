"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrip } from "@/hooks/useTrips";

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const tripId = params.id;
  const tripQuery = useTrip(tripId);

  if (tripQuery.isLoading) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-28 w-full" />
        </div>
      </main>
    );
  }

  if (tripQuery.isError || !tripQuery.data?.data) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <p className="text-sm text-destructive">
            {tripQuery.error instanceof Error
              ? tripQuery.error.message
              : "Failed to load trip details."}
          </p>
          <Button asChild variant="outline">
            <Link href="/trips">Back to trips</Link>
          </Button>
        </div>
      </main>
    );
  }

  const trip = tripQuery.data.data;

  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <Button asChild variant="outline">
          <Link href="/trips">Back to trips</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{trip.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{trip.description?.trim() || "No description provided."}</p>
            <p>Created: {new Date(trip.created_at).toLocaleString()}</p>
            <p>Updated: {new Date(trip.updated_at).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
