import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicLinkInfo, downloadPublicFile } from '../../api/public';
import { formatFileSize } from '../../utils/formatters';
import Loading from '../Common/Loading';
import './PublicDownload.css';

const PublicDownload: React.FC = () => {
  const { linkCode } = useParams<{ linkCode: string }>();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>('');
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    loadFileInfo();
  }, [linkCode]);

  const loadFileInfo = async () => {
    if (!linkCode) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const info = await getPublicLinkInfo(linkCode);
      setFileInfo(info);
      setShowPasswordInput(info.requiresPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!linkCode) return;

    if (showPasswordInput && !password) {
      setError('Please enter the password');
      return;
    }

    setDownloading(true);
    setError('');

    try {
      const blob = await downloadPublicFile(linkCode, password);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileInfo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  // Format date as YYYY-MM-DD
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Get file extension
  const getFileExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    return ext;
  };

  if (loading) {
    return <Loading fullScreen message="Loading file information..." />;
  }

  if (error && !fileInfo) {
    return (
      <div className="download-page">
        <div className="download-card">
          <div className="download-header error-header">
            <h1>Error</h1>
            <p>{error}</p>
          </div>
          <div className="download-body">
            <a href="/" className="btn-download">Go to Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="download-page">
      <div className="download-card">
        {/* Header with file name */}
        <div className="download-header">
          <h1 className="file-name">{fileInfo.filename}</h1>
          <p className="file-meta">{getFileExtension(fileInfo.filename)} · {formatFileSize(fileInfo.fileSize)}</p>
        </div>

        {/* Body */}
        <div className="download-body">
          {/* Stats cards */}
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Download Count</span>
              <span className="stat-value">{fileInfo.downloadCount?.toLocaleString() || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Upload Date</span>
              <span className="stat-value">{formatDate(fileInfo.createdAt)}</span>
            </div>
          </div>

          {/* Description */}
          {fileInfo.description && (
            <p className="file-description">{fileInfo.description}</p>
          )}

          {/* Password input if required */}
          {showPasswordInput && (
            <div className="password-section">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={downloading}
                className="password-input"
              />
            </div>
          )}

          {/* Error message */}
          {error && <div className="error-message">{error}</div>}

          {/* Download button */}
          <form onSubmit={handleDownload}>
            <button
              type="submit"
              disabled={downloading || (showPasswordInput && !password)}
              className="btn-download"
            >
              {downloading ? 'Downloading...' : 'Download File'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicDownload;
