"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type ApiEnvelope,
  type CreateTripInput,
  type ListTripsMeta,
  type Trip,
  type UpdateTripInput,
  createTrip,
  deleteTrip,
  getTrip,
  listTrips,
  updateTrip,
} from "@/lib/api";

type TripsParams = {
  limit?: number;
  offset?: number;
};

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

export function tripsQueryKey(params?: TripsParams) {
  return ["trips", params?.limit ?? DEFAULT_LIMIT, params?.offset ?? DEFAULT_OFFSET] as const;
}

export function tripQueryKey(id: string) {
  return ["trip", id] as const;
}

export function useTrips(params?: TripsParams) {
  return useQuery({
    queryKey: tripsQueryKey(params),
    queryFn: () => listTrips(params),
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: tripQueryKey(id),
    queryFn: () => getTrip(id),
    enabled: Boolean(id),
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTripInput) => createTrip(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["trips"] });

      const snapshots = queryClient.getQueriesData<ApiEnvelope<Trip[], ListTripsMeta>>({
        queryKey: ["trips"],
      });

      const nowIso = new Date().toISOString();
      const optimisticTrip: Trip = {
        id: `temp-${crypto.randomUUID()}`,
        user_id: "00000000-0000-0000-0000-000000000001",
        name: input.name,
        description: input.description ?? null,
        start_date: input.start_date ?? null,
        end_date: input.end_date ?? null,
        created_at: nowIso,
        updated_at: nowIso,
      };

      snapshots.forEach(([key, current]) => {
        if (!current) {
          return;
        }

        queryClient.setQueryData<ApiEnvelope<Trip[], ListTripsMeta>>(key, {
          ...current,
          data: [optimisticTrip, ...current.data],
          meta: {
            ...current.meta,
            total: current.meta.total + 1,
          },
        });
      });

      return { snapshots };
    },
    onError: (_error, _input, context) => {
      context?.snapshots.forEach(([key, snapshot]) => {
        queryClient.setQueryData(key, snapshot);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTripInput }) => updateTrip(id, input),
    onSuccess: (envelope, { id }) => {
      queryClient.setQueryData(tripQueryKey(id), envelope);
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: tripQueryKey(id) });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: tripQueryKey(id) });
    },
  });
}
