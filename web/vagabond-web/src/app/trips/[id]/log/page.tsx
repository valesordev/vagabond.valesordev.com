"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { FieldLogEntryForm } from "@/components/trips/FieldLogEntryForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteFieldLog, useFieldLogs } from "@/hooks/useFieldLogs";
import { useTrip } from "@/hooks/useTrips";
import { ApiClientError, type FieldLog } from "@/lib/api";

function formatLogHeading(isoDate: string): string {
  const parts = isoDate.split("-").map((p) => Number.parseInt(p, 10));
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    return isoDate;
  }
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function formatPowerWh(v: number): string {
  const rounded = Math.round(v * 100) / 100;
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 1e-9;
  const s = isWhole
    ? Math.round(rounded).toLocaleString()
    : rounded.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${s} Wh`;
}

function formatWaterGal(v: number): string {
  const s = v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${s} gal`;
}

export default function TripFieldLogPage() {
  const params = useParams<{ id: string }>();
  const tripId = params.id;

  const tripQuery = useTrip(tripId);
  const fieldLogsQuery = useFieldLogs(tripId);
  const deleteLog = useDeleteFieldLog(tripId);

  const trip = tripQuery.data?.data;
  const logs = useMemo(() => fieldLogsQuery.data?.data ?? [], [fieldLogsQuery.data]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<FieldLog | null>(null);
  const [confirmDeleteDate, setConfirmDeleteDate] = useState<string | null>(null);

  const openNew = () => {
    setEditingLog(null);
    setSheetOpen(true);
  };

  const openEdit = (log: FieldLog) => {
    setEditingLog(log);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingLog(null);
    }
  };

  async function confirmDelete(date: string) {
    try {
      await deleteLog.mutateAsync(date);
      setConfirmDeleteDate(null);
    } catch {
      // Error surfaced via mutation state on card if needed
    }
  }

  if (tripQuery.isLoading) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-[16rem_1fr]">
          <Skeleton className="h-40 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (tripQuery.isError || !trip) {
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
            <p className="text-sm text-destructive">
              {tripQuery.error instanceof Error
                ? tripQuery.error.message
                : "Failed to load trip."}
            </p>
          )}
          <Button asChild variant="outline">
            <Link href="/trips">Back to trips</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-[16rem_1fr]">
        <aside className="space-y-3">
          <Link
            href={`/trips/${tripId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Trip overview
          </Link>
          <div className="rounded-xl border border-border/70 bg-card/50 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Trip</p>
            <p className="mt-1 font-semibold leading-snug">{trip.name}</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <header className="space-y-3 border-b border-border/60 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={`/trips/${tripId}`}
                className="inline-flex min-w-0 items-center gap-2 text-lg font-semibold tracking-tight hover:text-primary"
              >
                <span aria-hidden>←</span>
                <span className="truncate">{trip.name}</span>
              </Link>
              <Button type="button" size="sm" onClick={openNew}>
                + New Entry
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {fieldLogsQuery.isLoading
                ? "Trip Log · …"
                : `Trip Log · ${logs.length} ${logs.length === 1 ? "entry" : "entries"}`}
            </p>
          </header>

          {fieldLogsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No log entries yet.
                <br />
                Use the field log to record daily notes, power and water usage,
                <br />
                and weather observations during your trip.
              </p>
              <Button type="button" className="mt-6" onClick={openNew}>
                + New Entry
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {logs.map((log) => (
                <li key={log.id}>
                  <FieldLogCard
                    log={log}
                    onEdit={() => openEdit(log)}
                    confirmDeleteDate={confirmDeleteDate}
                    onAskDelete={() => setConfirmDeleteDate(log.log_date)}
                    onCancelDelete={() => setConfirmDeleteDate(null)}
                    onConfirmDelete={() => void confirmDelete(log.log_date)}
                    deletePending={deleteLog.isPending && deleteLog.variables === log.log_date}
                    deleteError={deleteLog.error}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingLog ? "Edit log entry" : "New log entry"}</SheetTitle>
            <SheetDescription>
              {editingLog
                ? "Update notes, consumption, and weather for this day."
                : "Record what happened today on the trail."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <FieldLogEntryForm
              key={editingLog?.id ?? "new"}
              tripId={tripId}
              initialDate={editingLog?.log_date}
              existingLog={editingLog ?? undefined}
              onSuccess={() => {
                setSheetOpen(false);
                setEditingLog(null);
              }}
              onCancel={() => handleSheetOpenChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}

type FieldLogCardProps = {
  log: FieldLog;
  onEdit: () => void;
  confirmDeleteDate: string | null;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  deletePending: boolean;
  deleteError: Error | null;
};

function FieldLogCard({
  log,
  onEdit,
  confirmDeleteDate,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  deletePending,
  deleteError,
}: FieldLogCardProps) {
  const showConfirm = confirmDeleteDate === log.log_date;

  return (
    <Card>
      <CardHeader className="space-y-1 pb-2">
        <p className="text-base font-semibold">{formatLogHeading(log.log_date)}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {log.notes?.trim() ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{log.notes.trim()}</p>
        ) : null}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {log.actual_power_consumed_wh != null ? (
            <span>
              ⚡ {formatPowerWh(log.actual_power_consumed_wh)} consumed
            </span>
          ) : null}
          {log.actual_water_consumed_gal != null ? (
            <span>💧 {formatWaterGal(log.actual_water_consumed_gal)}</span>
          ) : null}
        </div>

        {log.actual_weather?.trim() ? (
          <p className="text-sm text-muted-foreground">🌤 {log.actual_weather.trim()}</p>
        ) : null}

        <div className="flex flex-wrap items-start justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onAskDelete}>
            Delete
          </Button>
        </div>

        {showConfirm ? (
          <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm">
            <p className="text-foreground">Delete this entry?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deletePending}
                onClick={onConfirmDelete}
              >
                {deletePending ? "Deleting…" : "Yes, delete"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onCancelDelete} disabled={deletePending}>
                Cancel
              </Button>
            </div>
            {deleteError ? (
              <p className="mt-2 text-destructive">
                {deleteError instanceof Error ? deleteError.message : "Delete failed."}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
