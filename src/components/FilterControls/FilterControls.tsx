import { MRStatus } from '../../types';

interface FilterControlsProps {
  statusFilters: Record<MRStatus, boolean>;
  onStatusFilterChange: (status: MRStatus, visible: boolean) => void;
  fetchClosedMRs: boolean;
  showDrafts: boolean;
  onDraftFilterChange: (showDrafts: boolean) => void;
}

const statusLabels: Record<MRStatus, string> = {
  [MRStatus.NEW]: '✨ New',
  [MRStatus.COMMENTED]: '💬 Commented',
  [MRStatus.APPROVED]: '✅ Approved',
  [MRStatus.REJECTED]: '⛔ Rejected',
  [MRStatus.MERGED]: '🎉 Merged',
};

export function FilterControls({
  statusFilters,
  onStatusFilterChange,
  fetchClosedMRs,
  showDrafts,
  onDraftFilterChange,
}: FilterControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          {Object.entries(statusLabels).map(([status, label]) => {
            const statusEnum = status as MRStatus;
            const isRejected = statusEnum === MRStatus.REJECTED;
            const isMerged = statusEnum === MRStatus.MERGED;
            const isDisabled = (isRejected || isMerged) && !fetchClosedMRs;
            const isChecked = isDisabled ? false : statusFilters[statusEnum];
            
            return (
              <label
                key={status}
                className={`flex items-center gap-2 px-3 py-1 rounded ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={(e) =>
                    onStatusFilterChange(statusEnum, e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm">{label}</span>
              </label>
            );
          })}
          {/* Draft filter checkbox */}
          <label className="flex items-center gap-2 px-3 py-1 rounded cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showDrafts}
              onChange={(e) => onDraftFilterChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm">📝 Draft</span>
          </label>
        </div>
      </div>
    </div>
  );
}

