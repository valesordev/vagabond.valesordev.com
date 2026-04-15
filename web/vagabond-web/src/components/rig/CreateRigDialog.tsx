"use client";

import { useState } from "react";

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
import { ApiClientError } from "@/lib/api";
import { useCreateRig } from "@/hooks/useRig";

type CreateRigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NAME_MAX_LENGTH = 256;
const MAKE_MAX_LENGTH = 256;
const MODEL_MAX_LENGTH = 256;
const NOTES_MAX_LENGTH = 8000;
const YEAR_MIN = 1980;
const YEAR_MAX = 2030;

export function CreateRigDialog({ open, onOpenChange }: CreateRigDialogProps) {
  const createRigMutation = useCreateRig();

  const [name, setName] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [fuelCapacityGal, setFuelCapacityGal] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    make?: string;
    model?: string;
    year?: string;
    fuel_capacity_gal?: string;
    notes?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setMake("");
    setModel("");
    setYear("");
    setFuelCapacityGal("");
    setNotes("");
    setFieldErrors({});
    setSubmitError(null);
  }

  function validate() {
    const errors: typeof fieldErrors = {};
    const trimmedName = name.trim();
    const trimmedMake = make.trim();
    const trimmedModel = model.trim();
    const trimmedYear = year.trim();

    if (!trimmedName) {
      errors.name = "Name is required.";
    } else if (trimmedName.length > NAME_MAX_LENGTH) {
      errors.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
    }

    if (!trimmedMake) {
      errors.make = "Make is required.";
    } else if (trimmedMake.length > MAKE_MAX_LENGTH) {
      errors.make = `Make must be ${MAKE_MAX_LENGTH} characters or fewer.`;
    }

    if (!trimmedModel) {
      errors.model = "Model is required.";
    } else if (trimmedModel.length > MODEL_MAX_LENGTH) {
      errors.model = `Model must be ${MODEL_MAX_LENGTH} characters or fewer.`;
    }

    if (!trimmedYear) {
      errors.year = "Year is required.";
    } else {
      const yearNum = Number.parseInt(trimmedYear, 10);
      if (!Number.isFinite(yearNum) || String(yearNum) !== trimmedYear) {
        errors.year = "Enter a valid year.";
      } else if (yearNum < YEAR_MIN || yearNum > YEAR_MAX) {
        errors.year = `Year must be between ${YEAR_MIN} and ${YEAR_MAX}.`;
      }
    }

    if (fuelCapacityGal.trim()) {
      const fuelNum = Number.parseFloat(fuelCapacityGal);
      if (!Number.isFinite(fuelNum) || fuelNum < 0) {
        errors.fuel_capacity_gal = "Enter a valid fuel capacity in gallons.";
      }
    }

    if (notes.length > NOTES_MAX_LENGTH) {
      errors.notes = `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    const yearNum = Number.parseInt(year.trim(), 10);
    const fuelTrimmed = fuelCapacityGal.trim();
    const fuelParsed = fuelTrimmed ? Number.parseFloat(fuelTrimmed) : null;

    try {
      await createRigMutation.mutateAsync({
        name: name.trim(),
        make: make.trim(),
        model: model.trim(),
        year: yearNum,
        fuel_capacity_gal: fuelParsed !== null && Number.isFinite(fuelParsed) ? fuelParsed : null,
        notes: notes.trim() ? notes.trim() : null,
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError("Failed to create rig. Please try again.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Rig Profile</DialogTitle>
          <DialogDescription>Add your vehicle details and optional notes.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="rig-name">Rig name</Label>
            <Input
              id="rig-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Desert Runner"
              aria-invalid={Boolean(fieldErrors.name)}
              required
            />
            {fieldErrors.name ? <p className="text-sm text-destructive">{fieldErrors.name}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rig-make">Make</Label>
              <Input
                id="rig-make"
                value={make}
                onChange={(event) => setMake(event.target.value)}
                maxLength={MAKE_MAX_LENGTH}
                placeholder="Toyota"
                aria-invalid={Boolean(fieldErrors.make)}
                required
              />
              {fieldErrors.make ? <p className="text-sm text-destructive">{fieldErrors.make}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rig-model">Model</Label>
              <Input
                id="rig-model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                maxLength={MODEL_MAX_LENGTH}
                placeholder="4Runner"
                aria-invalid={Boolean(fieldErrors.model)}
                required
              />
              {fieldErrors.model ? <p className="text-sm text-destructive">{fieldErrors.model}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rig-year">Year</Label>
              <Input
                id="rig-year"
                type="number"
                inputMode="numeric"
                min={YEAR_MIN}
                max={YEAR_MAX}
                value={year}
                onChange={(event) => setYear(event.target.value)}
                aria-invalid={Boolean(fieldErrors.year)}
                required
              />
              {fieldErrors.year ? <p className="text-sm text-destructive">{fieldErrors.year}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rig-fuel">Fuel capacity (gal)</Label>
              <Input
                id="rig-fuel"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={fuelCapacityGal}
                onChange={(event) => setFuelCapacityGal(event.target.value)}
                placeholder="Optional"
                aria-invalid={Boolean(fieldErrors.fuel_capacity_gal)}
              />
              {fieldErrors.fuel_capacity_gal ? (
                <p className="text-sm text-destructive">{fieldErrors.fuel_capacity_gal}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rig-notes">Notes</Label>
            <Textarea
              id="rig-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={NOTES_MAX_LENGTH}
              placeholder="Build notes, recovery gear, electrical..."
              rows={4}
              aria-invalid={Boolean(fieldErrors.notes)}
            />
            {fieldErrors.notes ? <p className="text-sm text-destructive">{fieldErrors.notes}</p> : null}
          </div>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRigMutation.isPending}>
              {createRigMutation.isPending ? "Creating..." : "Create Rig"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
