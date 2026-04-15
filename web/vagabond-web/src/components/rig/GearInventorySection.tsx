"use client";

import { useState } from "react";

import { AddGearDialog } from "@/components/rig/AddGearDialog";
import { EditGearDialog } from "@/components/rig/EditGearDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError, type GearItem, type GearStorageZone } from "@/lib/api";
import { useDeleteGearItem, useGear } from "@/hooks/useRig";

type GearInventorySectionProps = {
  rigId: string;
};

const ZONE_LABEL: Record<GearStorageZone, string> = {
  rear_cargo: "Rear Cargo",
  cargo_carrier: "Cargo Carrier",
  cab: "Cab",
  rooftop: "Rooftop",
  other: "Other",
};

function formatWeight(weightOz: number | null) {
  if (weightOz === null || weightOz === undefined) {
    return "—";
  }
  return `${weightOz} oz`;
}

export function GearInventorySection({ rigId }: GearInventorySectionProps) {
  const gearQuery = useGear(rigId);
  const deleteGearMutation = useDeleteGearItem(rigId);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GearItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<GearItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const gear = gearQuery.data?.data ?? [];

  function openEdit(item: GearItem) {
    setEditingItem(item);
    setIsEditOpen(true);
  }

  function openDelete(item: GearItem) {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deletingItem) {
      return;
    }

    try {
      await deleteGearMutation.mutateAsync(deletingItem.id);
      setIsDeleteOpen(false);
      setDeletingItem(null);
    } catch {
      // Error surfaced via mutation state if needed; keep dialog open.
    }
  }

  if (gearQuery.isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="overflow-hidden rounded-xl border border-border/80">
          <div className="grid grid-cols-5 gap-2 border-b border-border/80 bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="grid grid-cols-5 gap-2 border-b border-border/60 px-4 py-3 last:border-b-0">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (gearQuery.isError) {
    const message =
      gearQuery.error instanceof Error ? gearQuery.error.message : "Failed to load gear inventory.";
    const isUnauthorized = gearQuery.error instanceof ApiClientError && gearQuery.error.status === 401;

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Gear inventory</h2>
            <p className="text-sm text-muted-foreground">Items staged for this rig.</p>
          </div>
          <Button type="button" onClick={() => setIsAddOpen(true)}>
            Add gear
          </Button>
        </div>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{isUnauthorized ? "Authentication required." : message}</p>
          <div className="mt-3">
            <Button variant="outline" onClick={() => gearQuery.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Gear inventory</h2>
          <p className="text-sm text-muted-foreground">Items staged for this rig.</p>
        </div>
        <Button type="button" onClick={() => setIsAddOpen(true)}>
          Add gear
        </Button>
      </div>

      {gear.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No gear added yet.</p>
          <div className="mt-4">
            <Button type="button" onClick={() => setIsAddOpen(true)}>
              Add gear
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Storage zone</th>
                <th className="px-4 py-3">Weight</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gear.map((item) => (
                <tr key={item.id} className="border-b border-border/60 last:border-b-0">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{ZONE_LABEL[item.storage_zone]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatWeight(item.weight_oz)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => openDelete(item)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddGearDialog open={isAddOpen} onOpenChange={setIsAddOpen} rigId={rigId} />

      <EditGearDialog
        open={isEditOpen}
        onOpenChange={(next) => {
          setIsEditOpen(next);
          if (!next) {
            setEditingItem(null);
          }
        }}
        rigId={rigId}
        item={editingItem}
      />

      <Dialog
        open={isDeleteOpen}
        onOpenChange={(next) => {
          setIsDeleteOpen(next);
          if (!next) {
            setDeletingItem(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete gear?</DialogTitle>
            <DialogDescription>
              {deletingItem ? `Remove “${deletingItem.name}” from this rig? This cannot be undone.` : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleteGearMutation.isPending}>
              {deleteGearMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
