"use client";

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
import { Separator } from "@/components/ui/separator";

type Props = {
  open: boolean;
  file: File | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportGpxDialog({ open, file, onConfirm, onCancel, isPending, error }: Props) {
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
          <DialogTitle>Import GPX File</DialogTitle>
          <DialogDescription className="sr-only">
            Confirm importing the selected GPX file into this trip.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-3 py-1">
          {file ? (
            <>
              <p className="text-sm">
                <span className="text-muted-foreground">File: </span>
                <span className="font-medium break-all">{file.name}</span>
              </p>
              <p className="text-sm text-muted-foreground">Size: {formatFileSize(file.size)}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No file selected.</p>
          )}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <p className="text-sm text-muted-foreground">
            This will add a new leg with the imported waypoints and route to this trip.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isPending || !file}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Import
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
