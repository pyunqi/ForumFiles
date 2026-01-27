// Format file size from bytes to human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Format date to readable format
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  // Less than 1 day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // Format as date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format date to full datetime string
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Truncate filename if too long
export const truncateFilename = (
  filename: string,
  maxLength: number = 30
): string => {
  if (filename.length <= maxLength) return filename;

  const extension = filename.split('.').pop() || '';
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(
    0,
    maxLength - extension.length - 4
  );

  return `${truncatedName}...${extension}`;
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Get file icon based on extension
export const getFileIcon = (filename: string): string => {
  const ext = getFileExtension(filename);
  const iconMap: Record<string, string> = {
    // Images
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    // Documents
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📝',
    // Spreadsheets
    xls: '📊',
    xlsx: '📊',
    csv: '📊',
    // Archives
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    tar: '📦',
    gz: '📦',
    // Code
    js: '📜',
    ts: '📜',
    jsx: '📜',
    tsx: '📜',
    py: '📜',
    java: '📜',
    cpp: '📜',
    c: '📜',
    // Media
    mp3: '🎵',
    wav: '🎵',
    mp4: '🎬',
    avi: '🎬',
    mov: '🎬',
  };

  return iconMap[ext] || '📎';
};

// Format storage size with color coding
export const formatStorageWithColor = (
  bytes: number,
  maxBytes?: number
): { text: string; color: string } => {
  const text = formatFileSize(bytes);

  if (!maxBytes) {
    return { text, color: '#333' };
  }

  const percentage = (bytes / maxBytes) * 100;

  let color = '#22c55e'; // green
  if (percentage > 80) color = '#ef4444'; // red
  else if (percentage > 60) color = '#f59e0b'; // orange
  else if (percentage > 40) color = '#3b82f6'; // blue

  return { text, color };
};
