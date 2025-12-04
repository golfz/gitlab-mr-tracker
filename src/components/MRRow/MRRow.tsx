import { MergeRequest } from '../../types';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { AvatarList } from '../AvatarList/AvatarList';
import { Avatar } from '../Avatar/Avatar';
import { formatTimeAgo } from '../../utils/timeFormatter';

interface MRRowProps {
  mr: MergeRequest;
  onDelete: (id: string) => void;
  onHide: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  hasNewComments: boolean;
}

export function MRRow({ mr, onDelete, onHide, onMarkAsRead, hasNewComments }: MRRowProps) {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove "${mr.title}"?`)) {
      onDelete(mr.id);
    }
  };

  const handleHide = () => {
    onHide(mr.id);
  };

  const handleMRClick = () => {
    onMarkAsRead(mr.id);
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* Merge Request Column */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <a
              href={mr.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleMRClick}
              className={`text-blue-600 hover:text-blue-800 hover:underline font-medium ${
                hasNewComments ? 'font-semibold' : ''
              }`}
            >
              {mr.title}
            </a>
            {hasNewComments && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                New
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
            <span>{mr.repository}</span>
            <span>•</span>
            <span>#{mr.iid}</span>
            <span>•</span>
            <span>{formatTimeAgo(mr.createdAt)}</span>
          </div>
        </div>
      </td>

      {/* Status Column */}
      <td className="px-4 py-3">
        <StatusBadge status={mr.status} updatedAt={mr.statusUpdatedAt} hasNewComments={hasNewComments} />
      </td>

      {/* Author Column */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <div className="relative group">
            <Avatar
              src={mr.author.avatarUrl}
              name={mr.author.name}
              username={mr.author.username}
              size="sm"
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {mr.author.name} (@{mr.author.username})
            </div>
          </div>
        </div>
      </td>

      {/* Reviewer Column */}
      <td className="px-4 py-3">
        <AvatarList people={mr.reviewers} />
      </td>

      {/* Approver Column */}
      <td className="px-4 py-3">
        <AvatarList people={mr.approvers} />
      </td>

      {/* Action Column */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleHide}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-3 py-1 rounded transition-colors"
            title="Hide"
          >
            👁️‍🗨️
          </button>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}

