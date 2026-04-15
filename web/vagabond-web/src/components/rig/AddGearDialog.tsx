"use client";

import { useEffect, useState } from "react";

import { ApiClientError, type CreateGearInput } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateGearItem } from "@/hooks/useRig";
import { GearItemForm, type GearItemFormValues } from "@/components/rig/GearItemForm";

type AddGearDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rigId: string;
};

const EMPTY_VALUES: GearItemFormValues = {
  name: "",
  category: "",
  storage_zone: "rear_cargo",
  weight_oz: "",
  notes: "",
};

function parseWeightOz(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function AddGearDialog({ open, onOpenChange, rigId }: AddGearDialogProps) {
  const createGearMutation = useCreateGearItem(rigId);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open) {
      setFormKey((key) => key + 1);
    }
  }, [open]);

  async function handleSubmit(values: GearItemFormValues) {
    const input: CreateGearInput = {
      name: values.name,
      category: values.category,
      storage_zone: values.storage_zone,
      weight_oz: parseWeightOz(values.weight_oz),
      notes: values.notes.trim() ? values.notes.trim() : null,
    };

    try {
      await createGearMutation.mutateAsync(input);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to add gear.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add gear</DialogTitle>
          <DialogDescription>Add an item to this rig&apos;s inventory.</DialogDescription>
        </DialogHeader>

        <GearItemForm
          key={formKey}
          idPrefix="add-gear"
          initialValues={EMPTY_VALUES}
          onSubmit={handleSubmit}
          submitLabel="Add gear"
          isPending={createGearMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
