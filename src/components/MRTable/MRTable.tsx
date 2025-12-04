import { MergeRequest } from '../../types';
import { MRRow } from '../MRRow/MRRow';
import { MRCard } from '../MRCard/MRCard';

interface MRTableProps {
  title: string;
  mrList: MergeRequest[];
  onDelete: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  hasNewComments: (mr: MergeRequest) => boolean;
  isRead: (id: string) => boolean;
}

export function MRTable({ title, mrList, onDelete, onMarkAsRead, onMarkAsUnread, hasNewComments, isRead }: MRTableProps) {
  if (mrList.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Merge Request
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Reviewers
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Approvers
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {mrList.map((mr) => (
                <MRRow
                  key={mr.id}
                  mr={mr}
                  onDelete={onDelete}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAsUnread={onMarkAsUnread}
                  hasNewComments={hasNewComments(mr)}
                  isRead={isRead(mr.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {mrList.map((mr) => (
            <MRCard
              key={mr.id}
              mr={mr}
              onDelete={onDelete}
              onMarkAsRead={onMarkAsRead}
              onMarkAsUnread={onMarkAsUnread}
              hasNewComments={hasNewComments(mr)}
              isRead={isRead(mr.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

