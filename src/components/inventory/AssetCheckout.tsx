import React, { useState } from 'react';
import { useCheckOut, useCheckIn } from '../../hooks/queries/useTransactions';
import { useAsset } from '../../hooks/queries/useAssets';
import { AssetStatus } from '../../types/entities';

interface AssetCheckoutProps {
  assetId: string;
  userId: string;
  onComplete?: () => void;
}

export function AssetCheckout({ assetId, userId, onComplete }: AssetCheckoutProps) {
  const [dueDate, setDueDate] = useState<string>('');
  const { data: assetData } = useAsset(assetId);
  const asset = assetData?.data;

  const checkOutMutation = useCheckOut();
  const checkInMutation = useCheckIn();

  const isCheckedOut = asset?.status === AssetStatus.CHECKED_OUT;

  const handleCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync({
        assetId,
        userId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      onComplete?.();
    } catch (error) {
      console.error('Failed to check out asset:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync({
        assetId,
        userId,
      });
      onComplete?.();
    } catch (error) {
      console.error('Failed to check in asset:', error);
    }
  };

  if (!asset) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 text-lg font-semibold">
        {isCheckedOut ? 'Check In Asset' : 'Check Out Asset'}
      </h3>

      <div className="mb-4">
        <p className="text-sm text-gray-600">Asset: {asset.name}</p>
        <p className="text-sm text-gray-600">Status: {asset.status}</p>
      </div>

      {!isCheckedOut && (
        <div className="mb-4">
          <label htmlFor="dueDate" className="mb-1 block text-sm font-medium text-gray-700">
            Due Date (optional)
          </label>
          <input
            type="datetime-local"
            id="dueDate"
            className="w-full rounded border p-2"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      )}

      <div className="flex justify-end">
        {isCheckedOut ? (
          <button
            onClick={handleCheckIn}
            disabled={checkInMutation.isPending}
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
          >
            {checkInMutation.isPending ? 'Checking In...' : 'Check In'}
          </button>
        ) : (
          <button
            onClick={handleCheckOut}
            disabled={checkOutMutation.isPending}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {checkOutMutation.isPending ? 'Checking Out...' : 'Check Out'}
          </button>
        )}
      </div>

      {(checkOutMutation.isError || checkInMutation.isError) && (
        <div className="mt-2 text-sm text-red-600">
          An error occurred. Please try again.
        </div>
      )}
    </div>
  );
} 