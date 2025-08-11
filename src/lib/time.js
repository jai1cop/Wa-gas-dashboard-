export const formatDate = (date) => {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTime = (date) => {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTimeRange = (period = '24h') => {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '1h':
      start.setHours(start.getHours() - 1);
      break;
    case '6h':
      start.setHours(start.getHours() - 6);
      break;
    case '24h':
      start.setHours(start.getHours() - 24);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    default:
      start.setHours(start.getHours() - 24);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
};

export const isRecent = (date, hours = 1) => {
  const now = new Date();
  const compareDate = new Date(date);
  const diffMs = now - compareDate;
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours <= hours;
};
