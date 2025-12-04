import { MergeRequest } from '../../types';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { AvatarList } from '../AvatarList/AvatarList';
import { Avatar } from '../Avatar/Avatar';
import { formatTimeAgo } from '../../utils/timeFormatter';
import { splitRepositoryPath } from '../../utils/repositoryFormatter';

interface MRCardProps {
  mr: MergeRequest;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  hasNewComments: boolean;
  isRead: boolean;
}

export function MRCard({ mr, onMarkAsRead, onMarkAsUnread, hasNewComments, isRead }: MRCardProps) {
  const handleMRClick = () => {
    onMarkAsRead(mr.id);
  };

  const handleMarkAsUnread = () => {
    onMarkAsUnread(mr.id);
  };

  const repoParts = splitRepositoryPath(mr.repository);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={mr.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleMRClick}
              className={`hover:underline ${
                hasNewComments
                  ? 'text-blue-700 font-bold'
                  : 'text-blue-600 font-medium'
              } hover:text-blue-800`}
            >
              {mr.title}
            </a>
            {hasNewComments && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                New
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {isRead && (
            <button
              onClick={handleMarkAsUnread}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex-shrink-0"
              title="Mark as Unread"
            >
              ✉️
            </button>
          )}
        </div>
      </div>

      {/* Repository Info */}
      <div className="text-sm text-gray-500 mb-3">
        {repoParts ? (
          <span className="flex items-center gap-1">
            <span>{repoParts.namespace}</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
              {repoParts.projectName}
            </span>
          </span>
        ) : (
          <span>{mr.repository}</span>
        )}
        <span className="mx-2">•</span>
        <span>#{mr.iid}</span>
        <span className="mx-2">•</span>
        <span>{formatTimeAgo(mr.createdAt)}</span>
      </div>

      {/* Status */}
      <div className="mb-3">
        <StatusBadge status={mr.status} updatedAt={mr.statusUpdatedAt} hasNewComments={hasNewComments} />
      </div>

      {/* Author, Reviewers and Approvers */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-600 font-medium mb-1">Author</div>
          <div className="flex items-center">
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
        </div>
        <div>
          <div className="text-gray-600 font-medium mb-1">Reviewers</div>
          <AvatarList people={mr.reviewers} maxVisible={3} />
        </div>
        <div>
          <div className="text-gray-600 font-medium mb-1">Approvers</div>
          <AvatarList people={mr.approvers} maxVisible={3} />
        </div>
      </div>
    </div>
  );
}

