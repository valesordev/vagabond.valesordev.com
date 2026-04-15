"use client";

import { useEffect, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  lon: number;
  lat: number;
  onConfirm: (name: string, notes: string | null) => void;
  onCancel: () => void;
  isPending: boolean;
};

function formatCoordinateLine(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`;
  const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
  return `${latStr}, ${lonStr}`;
}

export function AddWaypointDialog({ open, lon, lat, onConfirm, onCancel, isPending }: Props) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setNotes("");
    }
  }, [open, lon, lat]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add waypoint</DialogTitle>
          <DialogDescription>
            Name this point. Coordinates are taken from your map click.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">{formatCoordinateLine(lat, lon)}</p>
          <div className="space-y-2">
            <Label htmlFor="waypoint-name">Name</Label>
            <Input
              id="waypoint-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              placeholder="e.g. Baker Fuel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waypoint-notes">Notes (optional)</Label>
            <Textarea
              id="waypoint-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={3}
              placeholder="Optional details"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              const trimmed = name.trim();
              if (!trimmed) {
                return;
              }
              const notesTrimmed = notes.trim();
              onConfirm(trimmed, notesTrimmed.length > 0 ? notesTrimmed : null);
            }}
            disabled={isPending || !name.trim()}
          >
            {isPending ? "Saving…" : "Save waypoint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
