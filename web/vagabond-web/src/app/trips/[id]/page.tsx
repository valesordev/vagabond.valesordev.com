"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Map from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError } from "@/lib/api";
import { useDeleteTrip, useTrip, useUpdateTrip } from "@/hooks/useTrips";

const DEFAULT_CENTER: [number, number] = [-117.0, 35.0];
const NAME_MAX_LENGTH = 256;
const DESCRIPTION_MAX_LENGTH = 8000;

type SaveState = "idle" | "saving" | "saved" | "error";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleString();
}

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tripId = params.id;

  const tripQuery = useTrip(tripId);
  const updateTripMutation = useUpdateTrip();
  const deleteTripMutation = useDeleteTrip();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");

  const trip = tripQuery.data?.data;

  useEffect(() => {
    if (!trip) {
      return;
    }
    setNameDraft(trip.name);
    setDescriptionDraft(trip.description ?? "");
  }, [trip?.id, trip?.name, trip?.description]);

  const initialCenter = useMemo<[number, number]>(() => {
    if (!trip) {
      return DEFAULT_CENTER;
    }

    const waypointCandidate = (trip as unknown as { waypoints?: Array<{ lon: number; lat: number }> }).waypoints?.[0];
    if (
      waypointCandidate &&
      Number.isFinite(waypointCandidate.lon) &&
      Number.isFinite(waypointCandidate.lat)
    ) {
      return [waypointCandidate.lon, waypointCandidate.lat];
    }

    return DEFAULT_CENTER;
  }, [trip]);

  function setSavedIndicator() {
    setSaveState("saved");
    setSaveMessage("Saved");
    window.setTimeout(() => {
      setSaveState((prev) => (prev === "saved" ? "idle" : prev));
      setSaveMessage((prev) => (prev === "Saved" ? "" : prev));
    }, 1400);
  }

  async function commitEdit(nextName: string, nextDescription: string) {
    if (!trip) {
      return;
    }

    const trimmedName = nextName.trim();
    if (!trimmedName) {
      setSaveState("error");
      setSaveMessage("Name is required.");
      return;
    }
    if (trimmedName.length > NAME_MAX_LENGTH) {
      setSaveState("error");
      setSaveMessage(`Name must be ${NAME_MAX_LENGTH} characters or fewer.`);
      return;
    }
    if (nextDescription.length > DESCRIPTION_MAX_LENGTH) {
      setSaveState("error");
      setSaveMessage(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`);
      return;
    }

    const normalizedDescription = nextDescription.trim() ? nextDescription.trim() : null;
    const unchanged = trip.name === trimmedName && (trip.description ?? null) === normalizedDescription;
    if (unchanged) {
      setSaveState("idle");
      setSaveMessage("");
      return;
    }

    setSaveState("saving");
    setSaveMessage("Saving...");

    try {
      await updateTripMutation.mutateAsync({
        id: trip.id,
        input: {
          name: trimmedName,
          description: normalizedDescription,
        },
      });

      setSavedIndicator();
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to save changes.");
    }
  }

  async function handleDeleteTrip() {
    if (!trip) {
      return;
    }

    try {
      await deleteTripMutation.mutateAsync(trip.id);
      router.push("/trips");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to delete trip.");
      setIsDeleteOpen(false);
    }
  }

  if (tripQuery.isLoading) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-[22rem] w-full md:col-span-2" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (tripQuery.isError) {
    const isNotFound = tripQuery.error instanceof ApiClientError && tripQuery.error.status === 404;
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {isNotFound ? (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Trip not found</h1>
              <p className="text-sm text-muted-foreground">
                This trip does not exist or is no longer accessible.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-destructive">
                {tripQuery.error instanceof Error
                  ? tripQuery.error.message
                  : "Failed to load trip details."}
              </p>
              <Button variant="outline" onClick={() => tripQuery.refetch()}>
                Retry
              </Button>
            </>
          )}
          <div>
            <Button asChild variant="outline">
              <Link href="/trips">Back to trips</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!trip) {
    return null;
  }

  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-3">
        <section className="order-1 h-[22rem] overflow-hidden rounded-xl border border-border/70 md:order-2 md:col-span-2 md:h-[calc(100vh-6rem)]">
          <Map initialCenter={initialCenter} initialZoom={8} />
        </section>

        <section className="order-2 md:order-1 md:col-span-1">
          <Card className="h-full">
            <CardHeader className="space-y-3">
              <Link href="/trips" className="text-sm text-muted-foreground hover:text-foreground">
                Trips / {trip.name}
              </Link>
              <CardTitle>
                {editingName ? (
                  <Input
                    autoFocus
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    className="h-10 text-xl font-semibold"
                    onBlur={async () => {
                      setEditingName(false);
                      await commitEdit(nameDraft, descriptionDraft);
                    }}
                    onKeyDown={async (event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setEditingName(false);
                        setNameDraft(trip.name);
                        setSaveState("idle");
                        setSaveMessage("");
                      }
                      if (event.key === "Enter") {
                        event.preventDefault();
                        setEditingName(false);
                        await commitEdit(nameDraft, descriptionDraft);
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="w-full text-left text-xl font-semibold hover:text-primary"
                    onClick={() => setEditingName(true)}
                  >
                    {trip.name}
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
                {editingDescription ? (
                  <Textarea
                    autoFocus
                    value={descriptionDraft}
                    onChange={(event) => setDescriptionDraft(event.target.value)}
                    onBlur={async () => {
                      setEditingDescription(false);
                      await commitEdit(nameDraft, descriptionDraft);
                    }}
                    onKeyDown={async (event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setEditingDescription(false);
                        setDescriptionDraft(trip.description ?? "");
                        setSaveState("idle");
                        setSaveMessage("");
                      }
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        setEditingDescription(false);
                        await commitEdit(nameDraft, descriptionDraft);
                      }
                    }}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    rows={4}
                  />
                ) : (
                  <button
                    type="button"
                    className="w-full rounded-md border border-transparent p-1 text-left text-muted-foreground hover:border-border hover:bg-muted/40"
                    onClick={() => setEditingDescription(true)}
                  >
                    {trip.description?.trim() || "Add a description..."}
                  </button>
                )}
              </div>

              <div className="space-y-1 text-muted-foreground">
                <p>Created: {formatDateTime(trip.created_at)}</p>
                <p>Updated: {formatDateTime(trip.updated_at)}</p>
              </div>

              <div className="h-5 text-xs text-muted-foreground">
                {saveState === "saving" || saveState === "saved" || saveState === "error" ? saveMessage : null}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="secondary">Add Leg</Button>
                <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                  Delete Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete trip?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The trip and its related data will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTrip} disabled={deleteTripMutation.isPending}>
              {deleteTripMutation.isPending ? "Deleting..." : "Delete Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
