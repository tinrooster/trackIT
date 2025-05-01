import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../../services/api';
import type { Transaction } from '../../types/entities';

// Query keys
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  byAsset: (assetId: string) => [...transactionKeys.lists(), 'asset', assetId] as const,
  byUser: (userId: string) => [...transactionKeys.lists(), 'user', userId] as const,
};

// Hooks
export function useTransactions() {
  return useQuery({
    queryKey: transactionKeys.lists(),
    queryFn: () => transactionApi.getAll(),
  });
}

export function useAssetTransactions(assetId: string) {
  return useQuery({
    queryKey: transactionKeys.byAsset(assetId),
    queryFn: () => transactionApi.getByAsset(assetId),
    enabled: !!assetId,
  });
}

export function useUserTransactions(userId: string) {
  return useQuery({
    queryKey: transactionKeys.byUser(userId),
    queryFn: () => transactionApi.getByUser(userId),
    enabled: !!userId,
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assetId,
      userId,
      dueDate,
    }: {
      assetId: string;
      userId: string;
      dueDate?: Date;
    }) => transactionApi.checkOut(assetId, userId, dueDate),
    onSuccess: (_, { assetId, userId }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.byAsset(assetId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, userId }: { assetId: string; userId: string }) =>
      transactionApi.checkIn(assetId, userId),
    onSuccess: (_, { assetId, userId }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.byAsset(assetId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
    },
  });
} 