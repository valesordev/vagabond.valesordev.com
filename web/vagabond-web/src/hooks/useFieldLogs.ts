"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type UpsertFieldLogInput,
  deleteFieldLog,
  listFieldLogs,
  upsertFieldLog,
} from "@/lib/api";

export function fieldLogsQueryKey(tripId: string) {
  return ["field_logs", tripId] as const;
}

export function useFieldLogs(tripId: string) {
  return useQuery({
    queryKey: fieldLogsQueryKey(tripId),
    queryFn: () => listFieldLogs(tripId),
    enabled: Boolean(tripId),
  });
}

export function useUpsertFieldLog(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, input }: { date: string; input: UpsertFieldLogInput }) =>
      upsertFieldLog(tripId, date, input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: fieldLogsQueryKey(tripId) });
    },
  });
}

export function useDeleteFieldLog(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => deleteFieldLog(tripId, date),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: fieldLogsQueryKey(tripId) });
    },
  });
}
