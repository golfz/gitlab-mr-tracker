import { formatDistanceToNow, format } from 'date-fns';

export function formatTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Unknown';
  }

  try {
    // Handle empty string
    if (dateString.trim() === '') {
      return 'Unknown';
    }

    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Unknown';
    }
    
    const now = new Date();
    const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    
    // If older than 7 days, show absolute date
    if (diffInDays > 7) {
      return format(date, 'MMM d, yyyy');
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.warn('Error formatting date:', dateString, error);
    return 'Unknown';
  }
}

export function formatAbsoluteTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    return format(date, 'MMM d, yyyy HH:mm');
  } catch {
    return 'Unknown';
  }
}

