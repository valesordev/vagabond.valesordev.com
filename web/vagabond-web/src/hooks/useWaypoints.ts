"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CreateWaypointInput,
  createLeg,
  createWaypoint,
  deleteWaypoint,
  importGpx,
  listTripLegs,
  listTripWaypoints,
} from "@/lib/api";

export function waypointsQueryKey(tripId: string) {
  return ["waypoints", tripId] as const;
}

export function tripLegsQueryKey(tripId: string) {
  return ["tripLegs", tripId] as const;
}

export function useTripWaypoints(tripId: string) {
  return useQuery({
    queryKey: waypointsQueryKey(tripId),
    queryFn: () => listTripWaypoints(tripId),
    enabled: Boolean(tripId),
  });
}

export function useTripLegs(tripId: string) {
  return useQuery({
    queryKey: tripLegsQueryKey(tripId),
    queryFn: () => listTripLegs(tripId),
    enabled: Boolean(tripId),
  });
}

export function useCreateLeg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, name }: { tripId: string; name?: string }) => createLeg(tripId, name),
    onSettled: (_data, _error, { tripId }) => {
      void queryClient.invalidateQueries({ queryKey: waypointsQueryKey(tripId) });
      void queryClient.invalidateQueries({ queryKey: tripLegsQueryKey(tripId) });
    },
  });
}

export function useCreateWaypoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      legId,
      input,
    }: {
      tripId: string;
      legId: string;
      input: CreateWaypointInput;
    }) => createWaypoint(tripId, legId, input),
    onSettled: (_data, _error, { tripId }) => {
      void queryClient.invalidateQueries({ queryKey: waypointsQueryKey(tripId) });
      void queryClient.invalidateQueries({ queryKey: tripLegsQueryKey(tripId) });
    },
  });
}

export function useDeleteWaypoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      legId,
      waypointId,
    }: {
      tripId: string;
      legId: string;
      waypointId: string;
    }) => deleteWaypoint(tripId, legId, waypointId),
    onSettled: (_data, _error, { tripId }) => {
      void queryClient.invalidateQueries({ queryKey: waypointsQueryKey(tripId) });
      void queryClient.invalidateQueries({ queryKey: tripLegsQueryKey(tripId) });
    },
  });
}

export function useImportGpx() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, file }: { tripId: string; file: File }) => importGpx(tripId, file),
    onSuccess: (_data, { tripId }) => {
      void queryClient.invalidateQueries({ queryKey: waypointsQueryKey(tripId) });
      void queryClient.invalidateQueries({ queryKey: tripLegsQueryKey(tripId) });
    },
  });
}
