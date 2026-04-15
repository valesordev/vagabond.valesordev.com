"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { GearStorageZone } from "@/lib/api";

export type GearItemFormValues = {
  name: string;
  category: string;
  storage_zone: GearStorageZone;
  weight_oz: string;
  notes: string;
};

type GearItemFormProps = {
  idPrefix: string;
  initialValues: GearItemFormValues;
  onSubmit: (values: GearItemFormValues) => Promise<void>;
  submitLabel: string;
  isPending: boolean;
};

const NAME_MAX_LENGTH = 256;
const CATEGORY_MAX_LENGTH = 256;
const NOTES_MAX_LENGTH = 8000;

const STORAGE_ZONE_OPTIONS: { value: GearStorageZone; label: string }[] = [
  { value: "rear_cargo", label: "Rear Cargo" },
  { value: "cargo_carrier", label: "Cargo Carrier" },
  { value: "cab", label: "Cab" },
  { value: "rooftop", label: "Rooftop" },
  { value: "other", label: "Other" },
];

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
  "md:text-sm dark:bg-input/30 dark:disabled:bg-input/80",
);

export function GearItemForm({ idPrefix, initialValues, onSubmit, submitLabel, isPending }: GearItemFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [category, setCategory] = useState(initialValues.category);
  const [storageZone, setStorageZone] = useState<GearStorageZone>(initialValues.storage_zone);
  const [weightOz, setWeightOz] = useState(initialValues.weight_oz);
  const [notes, setNotes] = useState(initialValues.notes);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; category?: string; weight_oz?: string; notes?: string }>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialValues.name);
    setCategory(initialValues.category);
    setStorageZone(initialValues.storage_zone);
    setWeightOz(initialValues.weight_oz);
    setNotes(initialValues.notes);
    setFieldErrors({});
    setSubmitError(null);
  }, [
    initialValues.name,
    initialValues.category,
    initialValues.storage_zone,
    initialValues.weight_oz,
    initialValues.notes,
  ]);

  function validate() {
    const errors: typeof fieldErrors = {};
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();

    if (!trimmedName) {
      errors.name = "Name is required.";
    } else if (trimmedName.length > NAME_MAX_LENGTH) {
      errors.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
    }

    if (!trimmedCategory) {
      errors.category = "Category is required.";
    } else if (trimmedCategory.length > CATEGORY_MAX_LENGTH) {
      errors.category = `Category must be ${CATEGORY_MAX_LENGTH} characters or fewer.`;
    }

    if (weightOz.trim()) {
      const weightNum = Number.parseFloat(weightOz);
      if (!Number.isFinite(weightNum) || weightNum < 0) {
        errors.weight_oz = "Enter a valid weight in ounces.";
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

    try {
      await onSubmit({
        name: name.trim(),
        category: category.trim(),
        storage_zone: storageZone,
        weight_oz: weightOz.trim(),
        notes,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={NAME_MAX_LENGTH}
          placeholder="Fridge"
          aria-invalid={Boolean(fieldErrors.name)}
          required
        />
        {fieldErrors.name ? <p className="text-sm text-destructive">{fieldErrors.name}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <Input
          id={`${idPrefix}-category`}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          maxLength={CATEGORY_MAX_LENGTH}
          placeholder="Kitchen, Electronics, Sleep..."
          aria-invalid={Boolean(fieldErrors.category)}
          required
        />
        {fieldErrors.category ? <p className="text-sm text-destructive">{fieldErrors.category}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-storage-zone`}>Storage zone</Label>
        <select
          id={`${idPrefix}-storage-zone`}
          className={selectClassName}
          value={storageZone}
          onChange={(event) => setStorageZone(event.target.value as GearStorageZone)}
        >
          {STORAGE_ZONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-weight`}>Weight (oz)</Label>
        <Input
          id={`${idPrefix}-weight`}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={weightOz}
          onChange={(event) => setWeightOz(event.target.value)}
          placeholder="Optional"
          aria-invalid={Boolean(fieldErrors.weight_oz)}
        />
        {fieldErrors.weight_oz ? <p className="text-sm text-destructive">{fieldErrors.weight_oz}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-notes`}>Notes</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={NOTES_MAX_LENGTH}
          placeholder="Placement, constraints..."
          rows={4}
          aria-invalid={Boolean(fieldErrors.notes)}
        />
        {fieldErrors.notes ? <p className="text-sm text-destructive">{fieldErrors.notes}</p> : null}
      </div>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
