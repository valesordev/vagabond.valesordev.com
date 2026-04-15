"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CreateGearInput,
  type CreateRigInput,
  type UpdateGearInput,
  type UpdateRigInput,
  createGearItem,
  createRig,
  deleteGearItem,
  deleteRig,
  listGear,
  listRigs,
  updateGearItem,
  updateRig,
} from "@/lib/api";

export function rigsQueryKey() {
  return ["rigs"] as const;
}

export function rigQueryKey(id: string) {
  return ["rig", id] as const;
}

export function gearQueryKey(rigId: string) {
  return ["gear", rigId] as const;
}

export function useRigs() {
  return useQuery({
    queryKey: rigsQueryKey(),
    queryFn: () => listRigs(),
  });
}

export function useCreateRig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRigInput) => createRig(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rigsQueryKey() });
    },
  });
}

export function useUpdateRig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRigInput }) => updateRig(id, input),
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: rigsQueryKey() });
      queryClient.invalidateQueries({ queryKey: rigQueryKey(id) });
    },
  });
}

export function useDeleteRig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRig(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rigsQueryKey() });
    },
  });
}

export function useGear(rigId: string) {
  return useQuery({
    queryKey: gearQueryKey(rigId),
    queryFn: () => listGear(rigId),
    enabled: Boolean(rigId),
  });
}

export function useCreateGearItem(rigId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGearInput) => createGearItem(rigId, input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: gearQueryKey(rigId) });
    },
  });
}

export function useUpdateGearItem(rigId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGearInput }) => updateGearItem(rigId, id, input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: gearQueryKey(rigId) });
    },
  });
}

export function useDeleteGearItem(rigId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGearItem(rigId, id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: gearQueryKey(rigId) });
    },
  });
}
