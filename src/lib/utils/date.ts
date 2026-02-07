export function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate + 'T00:00:00');
  const now = new Date();
  
  const diffMs = now.getTime() - birth.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} old`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;
    const weekText = `${weeks} week${weeks === 1 ? '' : 's'}`;
    const dayText = remainingDays > 0 ? ` ${remainingDays} day${remainingDays === 1 ? '' : 's'}` : '';
    return `${weekText}${dayText} old`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months === 1 ? '' : 's'} old`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'} old`;
  }
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDuration(startedAt: string, endedAt?: string | null, showSeconds = false): string {
  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : new Date();
  
  const diffMs = end.getTime() - start.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  // Rule: Show seconds only if total duration < 1 minute
  const totalMinutes = Math.floor(totalSeconds / 60);
  const shouldShowSeconds = showSeconds && totalMinutes < 1;
  
  if (shouldShowSeconds) {
    // Less than 1 minute: show seconds only
    return `${secs}s`;
  }
  
  // 1 minute or more: show hours/minutes only, NO seconds
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}
