import React, { useState } from 'react';
import { FileInfo } from '../../api/files';
import { useToast } from '../../contexts/ToastContext';
import { deleteFile, downloadFile } from '../../api/files';
import { formatFileSize, formatDate, getFileIcon } from '../../utils/formatters';
import './FileList.css';

interface FileListProps {
  files: FileInfo[];
  onFileDeleted?: () => void;
  showActions?: boolean;
  showUploader?: boolean;
}

const FileList: React.FC<FileListProps> = ({
  files,
  onFileDeleted,
  showActions = true,
  showUploader = false,
}) => {
  const { showSuccess, showError } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (file: FileInfo) => {
    setDownloadingId(file.id);
    try {
      const blob = await downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('Download started');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (!window.confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      return;
    }

    setDeletingId(file.id);
    try {
      await deleteFile(file.id);
      showSuccess('File deleted successfully');
      if (onFileDeleted) {
        onFileDeleted();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  if (files.length === 0) {
    return (
      <div className="file-list-empty">
        <div className="empty-icon">📂</div>
        <h3>No files yet</h3>
        <p>Upload your first file to get started</p>
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <div className="header-cell">File Name</div>
        <div className="header-cell">Description</div>
        <div className="header-cell">Size</div>
        <div className="header-cell">Upload Date</div>
        {showUploader && <div className="header-cell">Uploader</div>}
        <div className="header-cell">Downloads</div>
        {showActions && <div className="header-cell">Actions</div>}
      </div>

      <div className="file-list-body">
        {files.map((file) => (
          <div key={file.id} className="file-list-row">
            <div className="file-cell file-name-cell">
              <span className="file-icon">{getFileIcon(file.filename)}</span>
              <span className="file-name" title={file.filename}>
                {file.filename}
              </span>
            </div>
            <div className="file-cell" title={file.description}>
              {file.description || '-'}
            </div>
            <div className="file-cell">{formatFileSize(file.fileSize)}</div>
            <div className="file-cell">{formatDate(file.createdAt)}</div>
            {showUploader && (
              <div className="file-cell">{file.user?.email || 'Unknown'}</div>
            )}
            <div className="file-cell">{file.downloadCount}</div>
            {showActions && (
              <div className="file-cell actions-cell">
                <button
                  onClick={() => handleDownload(file)}
                  className="btn-action btn-download"
                  title="Download"
                  disabled={downloadingId === file.id}
                >
                  {downloadingId === file.id ? '...' : '⬇'}
                </button>
                <button
                  onClick={() => handleDelete(file)}
                  className="btn-action btn-delete"
                  title="Delete"
                  disabled={deletingId === file.id}
                >
                  {deletingId === file.id ? '...' : '🗑'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
