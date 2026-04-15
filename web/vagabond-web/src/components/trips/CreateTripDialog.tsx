"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

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
import { useCreateTrip } from "@/hooks/useTrips";

type CreateTripDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NAME_MAX_LENGTH = 256;
const DESCRIPTION_MAX_LENGTH = 8000;

export function CreateTripDialog({ open, onOpenChange }: CreateTripDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createTripMutation = useCreateTrip();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setDescription("");
    setFieldErrors({});
    setSubmitError(null);
  }

  function validate() {
    const errors: { name?: string; description?: string } = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      errors.name = "Name is required.";
    } else if (trimmedName.length > NAME_MAX_LENGTH) {
      errors.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
    }

    if (description.length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
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
      const response = await createTripMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
      });

      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      onOpenChange(false);
      resetForm();
      router.push(`/trips/${response.data.id}`);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError("Failed to create trip. Please try again.");
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
          <DialogTitle>New Trip</DialogTitle>
          <DialogDescription>Create a trip to start planning routes and campsites.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="trip-name">Name</Label>
            <Input
              id="trip-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Eastern Sierra Work Week"
              aria-invalid={Boolean(fieldErrors.name)}
              required
            />
            {fieldErrors.name ? <p className="text-sm text-destructive">{fieldErrors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-description">Description</Label>
            <Textarea
              id="trip-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={DESCRIPTION_MAX_LENGTH}
              placeholder="Goals, route notes, and key logistics..."
              rows={5}
              aria-invalid={Boolean(fieldErrors.description)}
            />
            {fieldErrors.description ? (
              <p className="text-sm text-destructive">{fieldErrors.description}</p>
            ) : null}
          </div>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTripMutation.isPending}>
              {createTripMutation.isPending ? "Creating..." : "Create Trip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
