"use client";

import { useState } from "react";

import { CreateTripDialog } from "@/components/trips/CreateTripDialog";
import { TripCard } from "@/components/trips/TripCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrips } from "@/hooks/useTrips";

function TripCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4">
      <Skeleton className="mb-3 h-5 w-2/3" />
      <Skeleton className="mb-4 h-4 w-1/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export default function TripsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const tripsQuery = useTrips({ limit: 24, offset: 0 });

  const trips = tripsQuery.data?.data ?? [];

  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
            <p className="text-sm text-muted-foreground">Plan routes, campsites, and logistics by trip.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>New Trip</Button>
        </header>

        {tripsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <TripCardSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {tripsQuery.isError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              {tripsQuery.error instanceof Error
                ? tripsQuery.error.message
                : "Failed to load trips. Please try again."}
            </p>
            <div className="mt-3">
              <Button variant="outline" onClick={() => tripsQuery.refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : null}

        {!tripsQuery.isLoading && !tripsQuery.isError && trips.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <h2 className="text-lg font-medium">No trips yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first trip to start planning.
            </p>
            <div className="mt-4">
              <Button onClick={() => setIsCreateOpen(true)}>Create Trip</Button>
            </div>
          </div>
        ) : null}

        {!tripsQuery.isLoading && !tripsQuery.isError && trips.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : null}
      </div>

      <CreateTripDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </main>
  );
}
