import { MRStatus } from '../../types';
import { formatTimeAgo } from '../../utils/timeFormatter';

interface StatusBadgeProps {
  status: MRStatus;
  updatedAt: string;
  hasNewComments?: boolean;
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

export function StatusBadge({ status, updatedAt, hasNewComments }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="text-xl" title={config.label}>
            {config.emoji}
          </span>
          {hasNewComments && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"
              title="New comments"
            />
          )}
        </div>
        <span className={`text-sm font-medium ${config.className}`}>
          {config.label}
        </span>
        {hasNewComments && (
          <span className="text-xs text-blue-600 font-medium" title="New comments since last read">
            New
          </span>
        )}
      </div>
      <span className="text-xs text-gray-500">{formatTimeAgo(updatedAt)}</span>
    </div>
  );
}

