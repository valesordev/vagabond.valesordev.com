"use client";

import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpsertFieldLog } from "@/hooks/useFieldLogs";
import { type FieldLog } from "@/lib/api";

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseOptionalPositiveNumber(raw: string): { value: number | null; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { value: null, error: null };
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    return { value: null, error: "Enter a positive number." };
  }
  return { value: n, error: null };
}

export type FieldLogEntryFormProps = {
  tripId: string;
  initialDate?: string;
  existingLog?: FieldLog | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export function FieldLogEntryForm({
  tripId,
  initialDate,
  existingLog,
  onSuccess,
  onCancel,
}: FieldLogEntryFormProps) {
  const upsert = useUpsertFieldLog(tripId);
  const isEdit = Boolean(existingLog);

  const [logDate, setLogDate] = useState(initialDate ?? existingLog?.log_date ?? todayYmd());
  const [notes, setNotes] = useState(existingLog?.notes ?? "");
  const [powerRaw, setPowerRaw] = useState(
    existingLog?.actual_power_consumed_wh != null ? String(existingLog.actual_power_consumed_wh) : "",
  );
  const [waterRaw, setWaterRaw] = useState(
    existingLog?.actual_water_consumed_gal != null ? String(existingLog.actual_water_consumed_gal) : "",
  );
  const [weather, setWeather] = useState(existingLog?.actual_weather ?? "");

  const [powerError, setPowerError] = useState<string | null>(null);
  const [waterError, setWaterError] = useState<string | null>(null);

  useEffect(() => {
    setLogDate(initialDate ?? existingLog?.log_date ?? todayYmd());
    setNotes(existingLog?.notes ?? "");
    setPowerRaw(
      existingLog?.actual_power_consumed_wh != null ? String(existingLog.actual_power_consumed_wh) : "",
    );
    setWaterRaw(
      existingLog?.actual_water_consumed_gal != null ? String(existingLog.actual_water_consumed_gal) : "",
    );
    setWeather(existingLog?.actual_weather ?? "");
    setPowerError(null);
    setWaterError(null);
  }, [initialDate, existingLog]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const powerParsed = parseOptionalPositiveNumber(powerRaw);
    const waterParsed = parseOptionalPositiveNumber(waterRaw);
    setPowerError(powerParsed.error);
    setWaterError(waterParsed.error);
    if (powerParsed.error || waterParsed.error) {
      return;
    }

    const inputDate = logDate.trim();
    if (!inputDate) {
      return;
    }

    await upsert.mutateAsync({
      date: inputDate,
      input: {
        log_date: inputDate,
        notes: notes.trim() ? notes.trim() : null,
        actual_power_consumed_wh: powerParsed.value,
        actual_water_consumed_gal: waterParsed.value,
        actual_weather: weather.trim() ? weather.trim() : null,
      },
    });
    onSuccess();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="field-log-date">Date</Label>
        <Input
          id="field-log-date"
          type="date"
          required
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          disabled={isEdit}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="field-log-notes">Notes</Label>
        <Textarea
          id="field-log-notes"
          rows={4}
          minLength={0}
          placeholder="What happened today?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="field-log-power">Power consumed (Wh)</Label>
        <Input
          id="field-log-power"
          type="number"
          inputMode="decimal"
          step="any"
          placeholder="e.g. 1840"
          value={powerRaw}
          onChange={(e) => {
            setPowerRaw(e.target.value);
            setPowerError(null);
          }}
        />
        {powerError ? <p className="text-sm text-destructive">{powerError}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="field-log-water">Water consumed (gal)</Label>
        <Input
          id="field-log-water"
          type="number"
          inputMode="decimal"
          step={0.25}
          placeholder="e.g. 1.75"
          value={waterRaw}
          onChange={(e) => {
            setWaterRaw(e.target.value);
            setWaterError(null);
          }}
        />
        {waterError ? <p className="text-sm text-destructive">{waterError}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="field-log-weather">Weather</Label>
        <Input
          id="field-log-weather"
          type="text"
          placeholder="e.g. Clear, 78°F, 20mph gusts"
          value={weather}
          onChange={(e) => setWeather(e.target.value)}
        />
      </div>

      {upsert.error ? (
        <p className="text-sm text-destructive">
          {upsert.error instanceof Error ? upsert.error.message : "Failed to save entry."}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={upsert.isPending}>
          {upsert.isPending ? "Saving…" : isEdit ? "Save changes" : "Save entry"}
        </Button>
      </div>
    </form>
  );
}
