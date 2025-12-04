import { useState, FormEvent } from 'react';

interface AddMRInputProps {
  onAdd: (url: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  onErrorClear: () => void;
}

export function AddMRInput({ onAdd, loading, error, onErrorClear }: AddMRInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;

    try {
      await onAdd(url.trim());
      setUrl('');
      onErrorClear();
    } catch {
      // Error is handled by parent
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) onErrorClear();
          }}
          placeholder="Add Custom MR URL..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

