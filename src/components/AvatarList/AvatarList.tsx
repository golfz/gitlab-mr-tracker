import { Avatar } from '../Avatar/Avatar';

interface Person {
  id: number;
  name: string;
  username: string;
  avatarUrl: string;
}

interface AvatarListProps {
  people: Person[];
  maxVisible?: number;
}

export function AvatarList({ people, maxVisible = 5 }: AvatarListProps) {
  if (people.length === 0) {
    return <span className="text-sm text-gray-400">-</span>;
  }

  const visible = people.slice(0, maxVisible);
  const remaining = people.length - maxVisible;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((person) => (
        <div key={person.id} className="relative group">
          <Avatar
            src={person.avatarUrl}
            name={person.name}
            username={person.username}
            size="sm"
          />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {person.name} (@{person.username})
          </div>
        </div>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-gray-500 ml-1">+{remaining}</span>
      )}
    </div>
  );
}

