"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import Map, { type MapHandle } from "@/components/Map";
import { AddWaypointDialog } from "@/components/trips/AddWaypointDialog";
import { ImportGpxDialog } from "@/components/trips/ImportGpxDialog";
import { LogEventDialog } from "@/components/trips/LogEventDialog";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateLeg,
  useCreateWaypoint,
  useDeleteWaypoint,
  useImportGpx,
  useTripLegs,
  useTripWaypoints,
  useUpdateWaypoint,
  tripLegsQueryKey,
} from "@/hooks/useWaypoints";
import { useDeleteTrip, useTrip, useUpdateTrip } from "@/hooks/useTrips";
import { useFieldLogs } from "@/hooks/useFieldLogs";
import { useCreateTripEvent, useDeleteTripEvent, useTripEvents } from "@/hooks/useTripEvents";
import { ApiClientError, listTripLegs, type CreateTripEventInput, type TripEvent } from "@/lib/api";

const DEFAULT_CENTER: [number, number] = [-117.0, 35.0];

const EVENT_TYPE_LABELS: Record<string, string> = {
  trip_start: "Trip Start",
  trip_end: "Trip End",
  fuel_fill: "Fuel Fill",
  water_fill: "Water Fill",
  stop: "Stop",
  campsite: "Campsite",
  hike: "Hike",
  vehicle_issue: "Vehicle Issue",
  note: "Note",
};

function eventSummary(event: TripEvent): string | null {
  const p = event.payload;
  if (!p) return null;
  switch (event.event_type) {
    case "fuel_fill":
      return `${p.gallons} gal`;
    case "water_fill":
      return `${p.gallons} gal${p.source ? ` — ${p.source}` : ""}`;
    case "stop":
      return String(p.stop_type).replace(/_/g, " ");
    case "campsite":
      return String(p.stay_type).replace(/_/g, " ");
    case "hike":
      return p.trail_name
        ? String(p.trail_name)
        : p.distance_miles
          ? `${p.distance_miles} mi`
          : null;
    case "vehicle_issue":
      return `${p.severity} — ${String(p.description).slice(0, 40)}`;
    default:
      return null;
  }
}
const NAME_MAX_LENGTH = 256;
const DESCRIPTION_MAX_LENGTH = 8000;
const MAX_GPX_BYTES = 10 * 1024 * 1024;

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
  const queryClient = useQueryClient();
  const mapRef = useRef<MapHandle>(null);
  const importGpxFileInputRef = useRef<HTMLInputElement>(null);

  const tripQuery = useTrip(tripId);
  const waypointsQuery = useTripWaypoints(tripId);
  useTripLegs(tripId);
  const updateTripMutation = useUpdateTrip();
  const deleteTripMutation = useDeleteTrip();
  const createLegMutation = useCreateLeg();
  const createWaypointMutation = useCreateWaypoint();
  const updateWaypointMutation = useUpdateWaypoint();
  const deleteWaypointMutation = useDeleteWaypoint();
  const importGpxMutation = useImportGpx();
  const eventsQuery = useTripEvents(tripId);
  const fieldLogsQuery = useFieldLogs(tripId);
  const createEventMutation = useCreateTripEvent();
  const deleteEventMutation = useDeleteTripEvent();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [startDateDraft, setStartDateDraft] = useState("");
  const [endDateDraft, setEndDateDraft] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");

  const [addingWaypoint, setAddingWaypoint] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingWaypointId, setEditingWaypointId] = useState<string | null>(null);
  const [editWaypointName, setEditWaypointName] = useState("");
  const [pendingLon, setPendingLon] = useState(0);
  const [pendingLat, setPendingLat] = useState(0);

  const [logEventDialogOpen, setLogEventDialogOpen] = useState(false);
  const [logEventError, setLogEventError] = useState<string | null>(null);

  const [importGpxDialogOpen, setImportGpxDialogOpen] = useState(false);
  const [importGpxFile, setImportGpxFile] = useState<File | null>(null);
  const [gpxFileSizeError, setGpxFileSizeError] = useState<string | null>(null);
  const [importSuccessBanner, setImportSuccessBanner] = useState<{
    leg_name: string;
    waypoints_imported: number;
  } | null>(null);

  const trip = tripQuery.data?.data;
  const waypoints = useMemo(
    () => waypointsQuery.data?.data ?? [],
    [waypointsQuery.data],
  );
  const events = useMemo(
    () => eventsQuery.data?.data ?? [],
    [eventsQuery.data],
  );
  const fieldLogCount = fieldLogsQuery.data?.meta?.total ?? fieldLogsQuery.data?.data?.length ?? 0;

  useEffect(() => {
    if (!trip) {
      return;
    }
    setNameDraft(trip.name);
    setDescriptionDraft(trip.description ?? "");
    setStartDateDraft(trip.start_date ?? "");
    setEndDateDraft(trip.end_date ?? "");
  }, [trip]);

  useEffect(() => {
    if (!importSuccessBanner) {
      return;
    }
    const id = window.setTimeout(() => {
      setImportSuccessBanner(null);
    }, 4000);
    return () => window.clearTimeout(id);
  }, [importSuccessBanner]);

  const importGpxErrorMessage = importGpxMutation.error
    ? importGpxMutation.error instanceof Error
      ? importGpxMutation.error.message
      : "Import failed."
    : null;

  const initialCenter = useMemo<[number, number]>(() => {
    const first = waypoints[0];
    if (first && Number.isFinite(first.lon) && Number.isFinite(first.lat)) {
      return [first.lon, first.lat];
    }
    return DEFAULT_CENTER;
  }, [waypoints]);

  const handleMapClick = useCallback(
    (lon: number, lat: number) => {
      if (!addingWaypoint) {
        return;
      }
      setPendingLon(lon);
      setPendingLat(lat);
      setAddDialogOpen(true);
    },
    [addingWaypoint],
  );

  async function resolveLegIdForNewWaypoint(): Promise<string> {
    const legsEnvelope = await queryClient.fetchQuery({
      queryKey: tripLegsQueryKey(tripId),
      queryFn: () => listTripLegs(tripId),
    });
    const legs = legsEnvelope.data;
    if (legs.length === 0) {
      const created = await createLegMutation.mutateAsync({ tripId });
      return created.data.id;
    }
    const sorted = [...legs].sort((a, b) => b.seq - a.seq);
    return sorted[0].id;
  }

  async function handleConfirmAddWaypoint(name: string, notes: string | null) {
    const legId = await resolveLegIdForNewWaypoint();
    await createWaypointMutation.mutateAsync({
      tripId,
      legId,
      input: {
        name,
        notes,
        lon: pendingLon,
        lat: pendingLat,
      },
    });
    setAddDialogOpen(false);
    setAddingWaypoint(false);
  }

  function handleCancelAddWaypoint() {
    setAddDialogOpen(false);
    setAddingWaypoint(false);
  }

  function handleImportGpxButtonClick() {
    setGpxFileSizeError(null);
    importGpxFileInputRef.current?.click();
  }

  function handleImportGpxFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) {
      return;
    }
    if (file.size > MAX_GPX_BYTES) {
      setGpxFileSizeError("GPX file must be under 10 MB");
      setImportGpxFile(null);
      setImportGpxDialogOpen(false);
      return;
    }
    setGpxFileSizeError(null);
    importGpxMutation.reset();
    setImportGpxFile(file);
    setImportGpxDialogOpen(true);
  }

  function handleImportGpxCancel() {
    setImportGpxDialogOpen(false);
    setImportGpxFile(null);
    importGpxMutation.reset();
  }

  function handleImportGpxConfirm() {
    if (!importGpxFile) {
      return;
    }
    importGpxMutation.mutate(
      { tripId, file: importGpxFile },
      {
        onSuccess: (envelope) => {
          setImportGpxDialogOpen(false);
          setImportGpxFile(null);
          setImportSuccessBanner({
            leg_name: envelope.data.leg_name,
            waypoints_imported: envelope.data.waypoints_imported,
          });
        },
      },
    );
  }

  function setSavedIndicator() {
    setSaveState("saved");
    setSaveMessage("Saved");
    window.setTimeout(() => {
      setSaveState((prev) => (prev === "saved" ? "idle" : prev));
      setSaveMessage((prev) => (prev === "Saved" ? "" : prev));
    }, 1400);
  }

  async function commitEdit(
    nextName: string,
    nextDescription: string,
    nextStartDate: string = startDateDraft,
    nextEndDate: string = endDateDraft,
  ) {
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
    const normalizedStart = nextStartDate.trim() ? nextStartDate.trim() : null;
    const normalizedEnd = nextEndDate.trim() ? nextEndDate.trim() : null;
    const unchanged =
      trip.name === trimmedName &&
      (trip.description ?? null) === normalizedDescription &&
      (trip.start_date ?? null) === normalizedStart &&
      (trip.end_date ?? null) === normalizedEnd;
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
          start_date: normalizedStart,
          end_date: normalizedEnd,
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

  function handleWaypointRowClick(lon: number, lat: number) {
    mapRef.current?.flyTo(lon, lat);
  }

  async function handleDeleteWaypointClick(waypointId: string, legId: string, name: string) {
    if (!window.confirm(`Delete waypoint "${name}"?`)) {
      return;
    }
    try {
      await deleteWaypointMutation.mutateAsync({ tripId, legId, waypointId });
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to delete waypoint.");
    }
  }

  async function handleToggleVisited(waypoint: (typeof waypoints)[number]) {
    try {
      await updateWaypointMutation.mutateAsync({
        tripId,
        legId: waypoint.leg_id,
        waypointId: waypoint.id,
        input: {
          name: waypoint.name,
          notes: waypoint.notes,
          lon: waypoint.lon,
          lat: waypoint.lat,
          visited: !waypoint.visited,
        },
      });
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to update waypoint.");
    }
  }

  async function handleSaveWaypointName(waypoint: (typeof waypoints)[number]) {
    const trimmed = editWaypointName.trim();
    if (!trimmed) {
      setSaveState("error");
      setSaveMessage("Waypoint name is required.");
      return;
    }
    try {
      await updateWaypointMutation.mutateAsync({
        tripId,
        legId: waypoint.leg_id,
        waypointId: waypoint.id,
        input: {
          name: trimmed,
          notes: waypoint.notes,
          lon: waypoint.lon,
          lat: waypoint.lat,
          visited: waypoint.visited,
          visited_at: waypoint.visited_at,
        },
      });
      setEditingWaypointId(null);
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to update waypoint.");
    }
  }

  async function handleLogEventConfirm(input: CreateTripEventInput) {
    try {
      await createEventMutation.mutateAsync({ tripId, input });
      setLogEventDialogOpen(false);
      setLogEventError(null);
    } catch (error) {
      setLogEventError(error instanceof Error ? error.message : "Failed to log event.");
    }
  }

  async function handleDeleteEventClick(eventId: string, eventType: string) {
    const label = EVENT_TYPE_LABELS[eventType] ?? eventType;
    if (!window.confirm(`Delete "${label}" event?`)) {
      return;
    }
    try {
      await deleteEventMutation.mutateAsync({ tripId, eventId });
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to delete event.");
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

  const addWaypointPending = createLegMutation.isPending || createWaypointMutation.isPending;

  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-3">
        <section className="order-1 h-[22rem] overflow-hidden rounded-xl border border-border/70 md:order-2 md:col-span-2 md:h-[calc(100vh-6rem)]">
          <Map
            key={tripId}
            ref={mapRef}
            initialCenter={initialCenter}
            initialZoom={8}
            waypoints={waypoints}
            waypointsFetchComplete={waypointsQuery.isFetched}
            onMapClick={handleMapClick}
          />
        </section>

        <section className="order-2 md:order-1 md:col-span-1">
          <Card className="h-full">
            {importSuccessBanner ? (
              <div className="flex items-start gap-2 border-b border-border/60 px-6 pt-4 pb-3 text-sm text-foreground">
                <p className="min-w-0 flex-1">
                  Imported {importSuccessBanner.leg_name} — {importSuccessBanner.waypoints_imported}{" "}
                  waypoints added.
                </p>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Dismiss import success"
                  onClick={() => setImportSuccessBanner(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Start</p>
                  <Input
                    type="date"
                    value={startDateDraft}
                    onChange={(event) => setStartDateDraft(event.target.value)}
                    onBlur={() => void commitEdit(nameDraft, descriptionDraft, startDateDraft, endDateDraft)}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">End</p>
                  <Input
                    type="date"
                    value={endDateDraft}
                    onChange={(event) => setEndDateDraft(event.target.value)}
                    onBlur={() => void commitEdit(nameDraft, descriptionDraft, startDateDraft, endDateDraft)}
                  />
                </div>
              </div>

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

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Waypoints ({waypointsQuery.isLoading ? "…" : waypoints.length})
                  </p>
                </div>
                <Separator />
                {waypointsQuery.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : waypoints.length === 0 ? (
                  <p className="text-muted-foreground">No waypoints yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {waypoints.map((w) => (
                      <li key={w.id}>
                        <div className="group flex items-center gap-2 rounded-md py-1 pl-1 pr-0">
                          <input
                            type="checkbox"
                            className="shrink-0"
                            checked={w.visited}
                            aria-label={`Mark ${w.name} visited`}
                            onChange={() => void handleToggleVisited(w)}
                          />
                          {editingWaypointId === w.id ? (
                            <Input
                              className="h-8 min-w-0 flex-1"
                              value={editWaypointName}
                              autoFocus
                              onChange={(event) => setEditWaypointName(event.target.value)}
                              onBlur={() => void handleSaveWaypointName(w)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  void handleSaveWaypointName(w);
                                }
                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  setEditingWaypointId(null);
                                }
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              className={`min-w-0 flex-1 truncate text-left hover:text-primary ${w.visited ? "text-muted-foreground line-through" : ""}`}
                              onClick={() => handleWaypointRowClick(w.lon, w.lat)}
                              onDoubleClick={() => {
                                setEditingWaypointId(w.id);
                                setEditWaypointName(w.name);
                              }}
                            >
                              <span className="text-muted-foreground">◦ </span>
                              {w.name}
                            </button>
                          )}
                          <button
                            type="button"
                            className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                            aria-label={`Delete ${w.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteWaypointClick(w.id, w.leg_id, w.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  ref={importGpxFileInputRef}
                  type="file"
                  accept=".gpx"
                  className="hidden"
                  onChange={handleImportGpxFileInputChange}
                />
                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleImportGpxButtonClick}
                  >
                    Import GPX
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setAddingWaypoint((prev) => !prev)}
                  >
                    {addingWaypoint ? "Cancel" : "+ Add Waypoint"}
                  </Button>
                </div>
                {gpxFileSizeError ? (
                  <p className="text-sm text-destructive">{gpxFileSizeError}</p>
                ) : null}
                {addingWaypoint ? (
                  <p className="text-xs text-muted-foreground">Click the map to place a waypoint.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    In the field
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/90">Events</span> capture moments with timestamps;
                  the{" "}
                  <span className="font-medium text-foreground/90">field log</span> is one entry per day for notes
                  and totals.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Events ({eventsQuery.isLoading ? "…" : events.length})
                  </p>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link href={`/trips/${tripId}/log`}>
                      Field log
                      {fieldLogsQuery.isLoading
                        ? " · …"
                        : ` · ${fieldLogCount} ${fieldLogCount === 1 ? "day" : "days"}`}
                    </Link>
                  </Button>
                </div>
                <Separator />
                {eventsQuery.isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : events.length === 0 ? (
                  <p className="text-muted-foreground">No events logged.</p>
                ) : (
                  <ul className="space-y-1">
                    {events.map((event) => (
                      <li key={event.id}>
                        <div className="group flex items-start gap-2 rounded-md py-1 pl-1 pr-0">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-medium">
                                {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(event.occurred_at)}
                              </span>
                            </div>
                            {(eventSummary(event) ?? event.notes) ? (
                              <p className="truncate text-xs text-muted-foreground">
                                {eventSummary(event) ?? event.notes}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                            aria-label={`Delete ${EVENT_TYPE_LABELS[event.event_type] ?? event.event_type} event`}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteEventClick(event.id, event.event_type);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setLogEventDialogOpen(true)}
                  >
                    + Log Event
                  </Button>
                </div>
              </div>

              <div className="space-y-1 text-muted-foreground">
                <p>Created: {formatDateTime(trip.created_at)}</p>
                <p>Updated: {formatDateTime(trip.updated_at)}</p>
              </div>

              <div className="h-5 text-xs text-muted-foreground">
                {saveState === "saving" || saveState === "saved" || saveState === "error" ? saveMessage : null}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
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

      <AddWaypointDialog
        open={addDialogOpen}
        lon={pendingLon}
        lat={pendingLat}
        onConfirm={(name, notes) => void handleConfirmAddWaypoint(name, notes)}
        onCancel={handleCancelAddWaypoint}
        isPending={addWaypointPending}
      />

      <ImportGpxDialog
        open={importGpxDialogOpen}
        file={importGpxFile}
        onConfirm={handleImportGpxConfirm}
        onCancel={handleImportGpxCancel}
        isPending={importGpxMutation.isPending}
        error={importGpxErrorMessage}
      />

      <LogEventDialog
        open={logEventDialogOpen}
        onConfirm={(input) => void handleLogEventConfirm(input)}
        onCancel={() => {
          setLogEventDialogOpen(false);
          setLogEventError(null);
        }}
        isPending={createEventMutation.isPending}
        error={logEventError}
      />
    </main>
  );
}
