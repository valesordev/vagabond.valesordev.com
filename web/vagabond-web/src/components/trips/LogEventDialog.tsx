"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { type CreateTripEventInput } from "@/lib/api";

const EVENT_TYPES = [
  { value: "trip_start", label: "Trip Start" },
  { value: "trip_end", label: "Trip End" },
  { value: "fuel_fill", label: "Fuel Fill" },
  { value: "water_fill", label: "Water Fill" },
  { value: "stop", label: "Stop" },
  { value: "campsite", label: "Campsite" },
  { value: "hike", label: "Hike" },
  { value: "vehicle_issue", label: "Vehicle Issue" },
  { value: "note", label: "Note" },
] as const;

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type Props = {
  open: boolean;
  onConfirm: (input: CreateTripEventInput) => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
};

export function LogEventDialog({ open, onConfirm, onCancel, isPending, error }: Props) {
  const [eventType, setEventType] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => toDatetimeLocal(new Date()));
  const [notes, setNotes] = useState("");

  // payload fields — only the relevant ones are rendered per type
  const [gallons, setGallons] = useState("");
  const [pricePerGallon, setPricePerGallon] = useState("");
  const [odometerMiles, setOdometerMiles] = useState("");
  const [waterSource, setWaterSource] = useState("");
  const [stopType, setStopType] = useState("other");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [stayType, setStayType] = useState("dispersed");
  const [nights, setNights] = useState("");
  const [trailName, setTrailName] = useState("");
  const [distanceMiles, setDistanceMiles] = useState("");
  const [elevationGainFt, setElevationGainFt] = useState("");
  const [issueSeverity, setIssueSeverity] = useState("low");
  const [issueDescription, setIssueDescription] = useState("");

  function resetForm() {
    setEventType("");
    setOccurredAt(toDatetimeLocal(new Date()));
    setNotes("");
    setGallons("");
    setPricePerGallon("");
    setOdometerMiles("");
    setWaterSource("");
    setStopType("other");
    setDurationMinutes("");
    setStayType("dispersed");
    setNights("");
    setTrailName("");
    setDistanceMiles("");
    setElevationGainFt("");
    setIssueSeverity("low");
    setIssueDescription("");
  }

  function handleCancel() {
    resetForm();
    onCancel();
  }

  function buildPayload(): Record<string, unknown> | null {
    switch (eventType) {
      case "trip_start":
      case "trip_end":
        return {
          type: eventType,
          ...(odometerMiles ? { odometer_miles: parseFloat(odometerMiles) } : {}),
        };
      case "fuel_fill":
        return {
          type: "fuel_fill",
          gallons: parseFloat(gallons),
          ...(pricePerGallon ? { price_per_gallon: parseFloat(pricePerGallon) } : {}),
          ...(odometerMiles ? { odometer_miles: parseFloat(odometerMiles) } : {}),
        };
      case "water_fill":
        return {
          type: "water_fill",
          gallons: parseFloat(gallons),
          ...(waterSource.trim() ? { source: waterSource.trim() } : {}),
        };
      case "stop":
        return {
          type: "stop",
          stop_type: stopType,
          ...(durationMinutes ? { duration_minutes: parseInt(durationMinutes, 10) } : {}),
        };
      case "campsite":
        return {
          type: "campsite",
          stay_type: stayType,
          ...(nights ? { nights: parseInt(nights, 10) } : {}),
        };
      case "hike":
        return {
          type: "hike",
          ...(trailName.trim() ? { trail_name: trailName.trim() } : {}),
          ...(distanceMiles ? { distance_miles: parseFloat(distanceMiles) } : {}),
          ...(elevationGainFt ? { elevation_gain_ft: parseFloat(elevationGainFt) } : {}),
        };
      case "vehicle_issue":
        return {
          type: "vehicle_issue",
          severity: issueSeverity,
          description: issueDescription.trim(),
        };
      case "note":
        return null;
      default:
        return null;
    }
  }

  function isFormValid(): boolean {
    if (!eventType) return false;
    if (eventType === "fuel_fill" || eventType === "water_fill") {
      const g = parseFloat(gallons);
      if (!gallons || isNaN(g) || g <= 0) return false;
    }
    if (eventType === "vehicle_issue" && !issueDescription.trim()) return false;
    return true;
  }

  function handleSubmit() {
    onConfirm({
      event_type: eventType,
      occurred_at: new Date(occurredAt).toISOString(),
      notes: notes.trim() || null,
      payload: buildPayload(),
    });
  }

  function renderPayloadFields() {
    switch (eventType) {
      case "trip_start":
      case "trip_end":
        return (
          <div className="space-y-1">
            <Label htmlFor="odometer">Odometer (mi)</Label>
            <Input
              id="odometer"
              type="number"
              min="0"
              step="1"
              value={odometerMiles}
              onChange={(e) => setOdometerMiles(e.target.value)}
              placeholder="Optional"
            />
          </div>
        );
      case "fuel_fill":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="gallons">
                Gallons <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gallons"
                type="number"
                min="0.1"
                step="0.01"
                value={gallons}
                onChange={(e) => setGallons(e.target.value)}
                placeholder="e.g. 15.3"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price">Price per gallon</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.001"
                value={pricePerGallon}
                onChange={(e) => setPricePerGallon(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="odometer">Odometer (mi)</Label>
              <Input
                id="odometer"
                type="number"
                min="0"
                step="1"
                value={odometerMiles}
                onChange={(e) => setOdometerMiles(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        );
      case "water_fill":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="gallons">
                Gallons <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gallons"
                type="number"
                min="0.1"
                step="0.01"
                value={gallons}
                onChange={(e) => setGallons(e.target.value)}
                placeholder="e.g. 5.0"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="water-source">Source</Label>
              <Input
                id="water-source"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                placeholder="e.g. Hole-in-the-Wall"
              />
            </div>
          </div>
        );
      case "stop":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="stop-type">Stop Type</Label>
              <select
                id="stop-type"
                value={stopType}
                onChange={(e) => setStopType(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="rest_area">Rest Area</option>
                <option value="meal">Meal</option>
                <option value="coffee">Coffee</option>
                <option value="scenic">Scenic</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                step="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        );
      case "campsite":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="stay-type">Stay Type</Label>
              <select
                id="stay-type"
                value={stayType}
                onChange={(e) => setStayType(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="dispersed">Dispersed</option>
                <option value="established">Established</option>
                <option value="stealth">Stealth</option>
                <option value="hotel">Hotel</option>
                <option value="rv_park">RV Park</option>
                <option value="friend_family">Friend / Family</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="nights">Nights</Label>
              <Input
                id="nights"
                type="number"
                min="1"
                step="1"
                value={nights}
                onChange={(e) => setNights(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        );
      case "hike":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="trail-name">Trail Name</Label>
              <Input
                id="trail-name"
                value={trailName}
                onChange={(e) => setTrailName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="distance">Distance (mi)</Label>
              <Input
                id="distance"
                type="number"
                min="0.1"
                step="0.1"
                value={distanceMiles}
                onChange={(e) => setDistanceMiles(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="elevation">Elevation Gain (ft)</Label>
              <Input
                id="elevation"
                type="number"
                min="0"
                step="10"
                value={elevationGainFt}
                onChange={(e) => setElevationGainFt(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        );
      case "vehicle_issue":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="severity">Severity</Label>
              <select
                id="severity"
                value={issueSeverity}
                onChange={(e) => setIssueSeverity(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="issue-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="issue-description"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={3}
                placeholder="Describe the issue"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Event</DialogTitle>
          <DialogDescription className="sr-only">
            Record an event that occurred during this trip.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-4 py-1">
          <div className="space-y-1">
            <Label htmlFor="event-type">Event Type</Label>
            <select
              id="event-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Select type...</option>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="occurred-at">When</Label>
            <Input
              id="occurred-at"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>

          {renderPayloadFields()}

          <div className="space-y-1">
            <Label htmlFor="event-notes">Notes</Label>
            <Textarea
              id="event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending || !isFormValid()}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Saving...
              </>
            ) : (
              "Log Event"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
