"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";

import { CreateRigDialog } from "@/components/rig/CreateRigDialog";
import { GearInventorySection } from "@/components/rig/GearInventorySection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Rig } from "@/lib/api";
import { useDeleteRig, useRigs, useUpdateRig } from "@/hooks/useRig";

const NAME_MAX_LENGTH = 256;
const MAKE_MAX_LENGTH = 256;
const MODEL_MAX_LENGTH = 256;
const NOTES_MAX_LENGTH = 8000;
const YEAR_MIN = 1980;
const YEAR_MAX = 2030;
const MPG_ESTIMATE = 17;

type SaveState = "idle" | "saving" | "saved" | "error";

function formatFuelRangeMiles(fuelGal: number | null) {
  if (fuelGal === null || fuelGal === undefined) {
    return null;
  }
  if (!Number.isFinite(fuelGal) || fuelGal < 0) {
    return null;
  }
  return Math.round(fuelGal * MPG_ESTIMATE);
}

export default function RigPage() {
  const rigsQuery = useRigs();
  const updateRigMutation = useUpdateRig();
  const deleteRigMutation = useDeleteRig();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [editingFuel, setEditingFuel] = useState(false);
  const [editingPower, setEditingPower] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);

  const [nameDraft, setNameDraft] = useState("");
  const [makeDraft, setMakeDraft] = useState("");
  const [modelDraft, setModelDraft] = useState("");
  const [yearDraft, setYearDraft] = useState("");
  const [fuelDraft, setFuelDraft] = useState("");
  const [batteryDraft, setBatteryDraft] = useState("");
  const [solarDraft, setSolarDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const vehicleGroupRef = useRef<HTMLDivElement>(null);

  const rig: Rig | undefined = rigsQuery.data?.data?.[0];

  useEffect(() => {
    if (!rig) {
      return;
    }
    setNameDraft(rig.name);
    setMakeDraft(rig.make);
    setModelDraft(rig.model);
    setYearDraft(String(rig.year));
    setFuelDraft(rig.fuel_capacity_gal !== null && rig.fuel_capacity_gal !== undefined ? String(rig.fuel_capacity_gal) : "");
    setBatteryDraft(
      rig.battery_capacity_wh !== null && rig.battery_capacity_wh !== undefined
        ? String(rig.battery_capacity_wh)
        : "",
    );
    setSolarDraft(
      rig.solar_peak_watts !== null && rig.solar_peak_watts !== undefined ? String(rig.solar_peak_watts) : "",
    );
    setNotesDraft(rig.notes ?? "");
  }, [rig]);

  function setSavedIndicator() {
    setSaveState("saved");
    setSaveMessage("Saved");
    window.setTimeout(() => {
      setSaveState((prev) => (prev === "saved" ? "idle" : prev));
      setSaveMessage((prev) => (prev === "Saved" ? "" : prev));
    }, 1400);
  }

  function normalizeFuelInput(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number.parseFloat(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }
    return parsed;
  }

  async function commitRigUpdate(next: {
    name: string;
    make: string;
    model: string;
    year: string;
    fuel: string;
    notes: string;
    battery?: string;
    solar?: string;
  }) {
    if (!rig) {
      return;
    }

    const trimmedName = next.name.trim();
    const trimmedMake = next.make.trim();
    const trimmedModel = next.model.trim();
    const trimmedYear = next.year.trim();
    const normalizedNotes = next.notes.trim() ? next.notes.trim() : null;
    const batteryRaw = next.battery ?? batteryDraft;
    const solarRaw = next.solar ?? solarDraft;

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

    if (!trimmedMake) {
      setSaveState("error");
      setSaveMessage("Make is required.");
      return;
    }
    if (trimmedMake.length > MAKE_MAX_LENGTH) {
      setSaveState("error");
      setSaveMessage(`Make must be ${MAKE_MAX_LENGTH} characters or fewer.`);
      return;
    }

    if (!trimmedModel) {
      setSaveState("error");
      setSaveMessage("Model is required.");
      return;
    }
    if (trimmedModel.length > MODEL_MAX_LENGTH) {
      setSaveState("error");
      setSaveMessage(`Model must be ${MODEL_MAX_LENGTH} characters or fewer.`);
      return;
    }

    if (!trimmedYear) {
      setSaveState("error");
      setSaveMessage("Year is required.");
      return;
    }
    const yearNum = Number.parseInt(trimmedYear, 10);
    if (!Number.isFinite(yearNum) || String(yearNum) !== trimmedYear) {
      setSaveState("error");
      setSaveMessage("Enter a valid year.");
      return;
    }
    if (yearNum < YEAR_MIN || yearNum > YEAR_MAX) {
      setSaveState("error");
      setSaveMessage(`Year must be between ${YEAR_MIN} and ${YEAR_MAX}.`);
      return;
    }

    const fuelCapacity = normalizeFuelInput(next.fuel);
    if (next.fuel.trim() && fuelCapacity === null) {
      setSaveState("error");
      setSaveMessage("Enter a valid fuel capacity in gallons.");
      return;
    }

    const batteryCapacity = normalizeFuelInput(batteryRaw);
    if (batteryRaw.trim() && batteryCapacity === null) {
      setSaveState("error");
      setSaveMessage("Enter a valid battery capacity in Wh.");
      return;
    }

    const solarPeak = normalizeFuelInput(solarRaw);
    if (solarRaw.trim() && solarPeak === null) {
      setSaveState("error");
      setSaveMessage("Enter a valid solar peak watts value.");
      return;
    }

    if (next.notes.length > NOTES_MAX_LENGTH) {
      setSaveState("error");
      setSaveMessage(`Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`);
      return;
    }

    const unchanged =
      rig.name === trimmedName &&
      rig.make === trimmedMake &&
      rig.model === trimmedModel &&
      rig.year === yearNum &&
      (rig.fuel_capacity_gal ?? null) === (fuelCapacity ?? null) &&
      (rig.battery_capacity_wh ?? null) === (batteryCapacity ?? null) &&
      (rig.solar_peak_watts ?? null) === (solarPeak ?? null) &&
      (rig.notes ?? null) === normalizedNotes;

    if (unchanged) {
      setSaveState("idle");
      setSaveMessage("");
      return;
    }

    setSaveState("saving");
    setSaveMessage("Saving...");

    try {
      await updateRigMutation.mutateAsync({
        id: rig.id,
        input: {
          name: trimmedName,
          make: trimmedMake,
          model: trimmedModel,
          year: yearNum,
          fuel_capacity_gal: fuelCapacity,
          battery_capacity_wh: batteryCapacity,
          solar_peak_watts: solarPeak,
          notes: normalizedNotes,
        },
      });

      setSavedIndicator();
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to save changes.");
    }
  }

  async function handleDeleteRig() {
    if (!rig) {
      return;
    }
    try {
      await deleteRigMutation.mutateAsync(rig.id);
      setIsDeleteOpen(false);
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to delete rig.");
      setIsDeleteOpen(false);
    }
  }

  if (rigsQuery.isLoading) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (rigsQuery.isError) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-xl font-semibold tracking-tight">Rig</h1>
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              {rigsQuery.error instanceof Error ? rigsQuery.error.message : "Failed to load rig profile."}
            </p>
            <div className="mt-3">
              <Button variant="outline" onClick={() => rigsQuery.refetch()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const rigs = rigsQuery.data?.data ?? [];

  if (rigs.length === 0) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Your Rig</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="h-px w-full bg-border" />
              <p className="text-sm text-muted-foreground">No rig profile yet.</p>
              <Button type="button" onClick={() => setIsCreateOpen(true)}>
                + Create Rig Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        <CreateRigDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </main>
    );
  }

  if (!rig) {
    return null;
  }

  function handleVehicleFieldBlur(event: FocusEvent<HTMLInputElement>) {
    const next = event.relatedTarget;
    if (vehicleGroupRef.current && next instanceof Node && vehicleGroupRef.current.contains(next)) {
      return;
    }
    setEditingVehicle(false);
    void commitRigUpdate({
      name: nameDraft,
      make: makeDraft,
      model: modelDraft,
      year: yearDraft,
      fuel: fuelDraft,
      notes: notesDraft,
    });
  }

  const fuelRangeMiles = formatFuelRangeMiles(rig.fuel_capacity_gal);

  return (
    <main className="p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Rig</h1>
          <p className="text-sm text-muted-foreground">Vehicle profile and staged gear for trips.</p>
        </header>

        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>
              {editingName ? (
                <Input
                  autoFocus
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  className="h-10 text-xl font-semibold"
                  maxLength={NAME_MAX_LENGTH}
                  onBlur={async () => {
                    setEditingName(false);
                    await commitRigUpdate({
                      name: nameDraft,
                      make: makeDraft,
                      model: modelDraft,
                      year: yearDraft,
                      fuel: fuelDraft,
                      notes: notesDraft,
                    });
                  }}
                  onKeyDown={async (event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setEditingName(false);
                      setNameDraft(rig.name);
                      setSaveState("idle");
                      setSaveMessage("");
                    }
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setEditingName(false);
                      await commitRigUpdate({
                        name: nameDraft,
                        make: makeDraft,
                        model: modelDraft,
                        year: yearDraft,
                        fuel: fuelDraft,
                        notes: notesDraft,
                      });
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="w-full text-left text-xl font-semibold hover:text-primary"
                  onClick={() => setEditingName(true)}
                >
                  {rig.name}
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Vehicle</p>
              {editingVehicle ? (
                <div ref={vehicleGroupRef} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    autoFocus
                    value={makeDraft}
                    onChange={(event) => setMakeDraft(event.target.value)}
                    placeholder="Make"
                    maxLength={MAKE_MAX_LENGTH}
                    onBlur={handleVehicleFieldBlur}
                    onKeyDown={async (event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setEditingVehicle(false);
                        setMakeDraft(rig.make);
                        setModelDraft(rig.model);
                        setYearDraft(String(rig.year));
                        setSaveState("idle");
                        setSaveMessage("");
                      }
                    }}
                  />
                  <Input
                    value={modelDraft}
                    onChange={(event) => setModelDraft(event.target.value)}
                    placeholder="Model"
                    maxLength={MODEL_MAX_LENGTH}
                    onBlur={handleVehicleFieldBlur}
                    onKeyDown={async (event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setEditingVehicle(false);
                        setMakeDraft(rig.make);
                        setModelDraft(rig.model);
                        setYearDraft(String(rig.year));
                        setSaveState("idle");
                        setSaveMessage("");
                      }
                    }}
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={YEAR_MIN}
                    max={YEAR_MAX}
                    value={yearDraft}
                    onChange={(event) => setYearDraft(event.target.value)}
                    placeholder="Year"
                    onBlur={handleVehicleFieldBlur}
                    onKeyDown={async (event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setEditingVehicle(false);
                        setMakeDraft(rig.make);
                        setModelDraft(rig.model);
                        setYearDraft(String(rig.year));
                        setSaveState("idle");
                        setSaveMessage("");
                      }
                    }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full rounded-md border border-transparent p-1 text-left text-base hover:border-border hover:bg-muted/40"
                  onClick={() => setEditingVehicle(true)}
                >
                  {`${rig.make} ${rig.model} ${rig.year}`}
                </button>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Fuel capacity (gal)</p>
              {editingFuel ? (
                <Input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={fuelDraft}
                  onChange={(event) => setFuelDraft(event.target.value)}
                  placeholder="Optional"
                  onBlur={async () => {
                    setEditingFuel(false);
                    await commitRigUpdate({
                      name: nameDraft,
                      make: makeDraft,
                      model: modelDraft,
                      year: yearDraft,
                      fuel: fuelDraft,
                      notes: notesDraft,
                    });
                  }}
                  onKeyDown={async (event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setEditingFuel(false);
                      setFuelDraft(
                        rig.fuel_capacity_gal !== null && rig.fuel_capacity_gal !== undefined
                          ? String(rig.fuel_capacity_gal)
                          : "",
                      );
                      setSaveState("idle");
                      setSaveMessage("");
                    }
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setEditingFuel(false);
                      await commitRigUpdate({
                        name: nameDraft,
                        make: makeDraft,
                        model: modelDraft,
                        year: yearDraft,
                        fuel: fuelDraft,
                        notes: notesDraft,
                      });
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="w-full rounded-md border border-transparent p-1 text-left hover:border-border hover:bg-muted/40"
                  onClick={() => setEditingFuel(true)}
                >
                  {rig.fuel_capacity_gal !== null && rig.fuel_capacity_gal !== undefined ? (
                    <span>
                      {rig.fuel_capacity_gal} gal
                      {fuelRangeMiles !== null ? ` (~${fuelRangeMiles} mi)` : null}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Add fuel capacity...</span>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Power system</p>
              {editingPower ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Battery (Wh)</p>
                    <Input
                      autoFocus
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={batteryDraft}
                      onChange={(event) => setBatteryDraft(event.target.value)}
                      placeholder="e.g. 3162"
                      onBlur={async () => {
                        setEditingPower(false);
                        await commitRigUpdate({
                          name: nameDraft,
                          make: makeDraft,
                          model: modelDraft,
                          year: yearDraft,
                          fuel: fuelDraft,
                          notes: notesDraft,
                          battery: batteryDraft,
                          solar: solarDraft,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Solar peak (W)</p>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={solarDraft}
                      onChange={(event) => setSolarDraft(event.target.value)}
                      placeholder="e.g. 400"
                      onBlur={async () => {
                        setEditingPower(false);
                        await commitRigUpdate({
                          name: nameDraft,
                          make: makeDraft,
                          model: modelDraft,
                          year: yearDraft,
                          fuel: fuelDraft,
                          notes: notesDraft,
                          battery: batteryDraft,
                          solar: solarDraft,
                        });
                      }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full rounded-md border border-transparent p-1 text-left hover:border-border hover:bg-muted/40"
                  onClick={() => setEditingPower(true)}
                >
                  {rig.battery_capacity_wh != null || rig.solar_peak_watts != null ? (
                    <span>
                      {rig.battery_capacity_wh != null ? `${rig.battery_capacity_wh} Wh` : "Battery —"}
                      {" · "}
                      {rig.solar_peak_watts != null ? `${rig.solar_peak_watts} W solar` : "Solar —"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Add battery and solar capacity...</span>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
              {editingNotes ? (
                <Textarea
                  autoFocus
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  maxLength={NOTES_MAX_LENGTH}
                  rows={5}
                  onBlur={async () => {
                    setEditingNotes(false);
                    await commitRigUpdate({
                      name: nameDraft,
                      make: makeDraft,
                      model: modelDraft,
                      year: yearDraft,
                      fuel: fuelDraft,
                      notes: notesDraft,
                    });
                  }}
                  onKeyDown={async (event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setEditingNotes(false);
                      setNotesDraft(rig.notes ?? "");
                      setSaveState("idle");
                      setSaveMessage("");
                    }
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      setEditingNotes(false);
                      await commitRigUpdate({
                        name: nameDraft,
                        make: makeDraft,
                        model: modelDraft,
                        year: yearDraft,
                        fuel: fuelDraft,
                        notes: notesDraft,
                      });
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="w-full rounded-md border border-transparent p-1 text-left text-muted-foreground hover:border-border hover:bg-muted/40"
                  onClick={() => setEditingNotes(true)}
                >
                  {notesDraft.trim() || "Add notes..."}
                </button>
              )}
            </div>

            <div className="h-5 text-xs text-muted-foreground">
              {saveState === "saving" || saveState === "saved" || saveState === "error" ? saveMessage : null}
            </div>

            <div className="border-t border-border pt-4">
              {isDeleteOpen ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-destructive">Delete this rig and its gear?</p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deleteRigMutation.isPending}
                    onClick={() => void handleDeleteRig()}
                  >
                    {deleteRigMutation.isPending ? "Deleting..." : "Confirm delete"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteOpen(true)}>
                  Delete rig
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <GearInventorySection rigId={rig.id} />
      </div>
    </main>
  );
}
