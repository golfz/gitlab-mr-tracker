import { MRStatus } from '../../types';
import { formatTimeAgo } from '../../utils/timeFormatter';

interface StatusBadgeProps {
  status: MRStatus;
  updatedAt: string;
}

const statusConfig = {
  [MRStatus.COMMENTED]: {
    emoji: '💬',
    label: 'Commented',
    className: 'text-blue-600',
  },
  [MRStatus.APPROVED]: {
    emoji: '✅',
    label: 'Approved',
    className: 'text-green-600',
  },
  [MRStatus.REJECTED]: {
    emoji: '⛔',
    label: 'Rejected',
    className: 'text-red-600',
  },
  [MRStatus.MERGED]: {
    emoji: '🎉',
    label: 'Merged',
    className: 'text-purple-600',
  },
};

export function StatusBadge({ status, updatedAt }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xl" title={config.label}>
          {config.emoji}
        </span>
        <span className={`text-sm font-medium ${config.className}`}>
          {config.label}
        </span>
      </div>
      <span className="text-xs text-gray-500">{formatTimeAgo(updatedAt)}</span>
    </div>
  );
}

