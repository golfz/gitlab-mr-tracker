import { useState } from 'react';

interface AvatarProps {
  src: string;
  name: string;
  username?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, name, username, size = 'md' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center overflow-hidden relative group`}
      title={username ? `${name} (@${username})` : name}
    >
      {!imageError && src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-gray-600 font-medium">{getInitials(name)}</span>
      )}
    </div>
  );
}

