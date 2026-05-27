"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CreateTripEventInput,
  createTripEvent,
  deleteTripEvent,
  listTripEvents,
} from "@/lib/api";

export function tripEventsQueryKey(tripId: string) {
  return ["trip_events", tripId] as const;
}

export function useTripEvents(tripId: string) {
  return useQuery({
    queryKey: tripEventsQueryKey(tripId),
    queryFn: () => listTripEvents(tripId),
    enabled: Boolean(tripId),
  });
}

export function useCreateTripEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, input }: { tripId: string; input: CreateTripEventInput }) =>
      createTripEvent(tripId, input),
    onSettled: (_data, _error, { tripId }) => {
      void queryClient.invalidateQueries({ queryKey: tripEventsQueryKey(tripId) });
    },
  });
}

export function useDeleteTripEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, eventId }: { tripId: string; eventId: string }) =>
      deleteTripEvent(tripId, eventId),
    onSettled: (_data, _error, { tripId }) => {
      void queryClient.invalidateQueries({ queryKey: tripEventsQueryKey(tripId) });
    },
  });
}
