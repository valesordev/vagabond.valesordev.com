"use client";

import { ApiClientError, type GearItem, type UpdateGearInput } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateGearItem } from "@/hooks/useRig";
import { GearItemForm, type GearItemFormValues } from "@/components/rig/GearItemForm";

type EditGearDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rigId: string;
  item: GearItem | null;
};

function parseWeightOz(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function itemToFormValues(item: GearItem): GearItemFormValues {
  return {
    name: item.name,
    category: item.category,
    storage_zone: item.storage_zone,
    weight_oz: item.weight_oz !== null && item.weight_oz !== undefined ? String(item.weight_oz) : "",
    notes: item.notes ?? "",
  };
}

export function EditGearDialog({ open, onOpenChange, rigId, item }: EditGearDialogProps) {
  const updateGearMutation = useUpdateGearItem(rigId);

  async function handleSubmit(values: GearItemFormValues) {
    if (!item) {
      return;
    }

    const input: UpdateGearInput = {
      name: values.name,
      category: values.category,
      storage_zone: values.storage_zone,
      weight_oz: parseWeightOz(values.weight_oz),
      notes: values.notes.trim() ? values.notes.trim() : null,
    };

    try {
      await updateGearMutation.mutateAsync({ id: item.id, input });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update gear.");
    }
  }

  if (!item) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit gear</DialogTitle>
          <DialogDescription>Update this inventory item.</DialogDescription>
        </DialogHeader>

        <GearItemForm
          key={item.id}
          idPrefix="edit-gear"
          initialValues={itemToFormValues(item)}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          isPending={updateGearMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
