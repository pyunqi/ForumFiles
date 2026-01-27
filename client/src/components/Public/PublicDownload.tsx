import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicLinkInfo, downloadPublicFile } from '../../api/public';
import { formatFileSize, formatDate } from '../../utils/formatters';
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

      // Show success message
      setError('');
      alert('Download started successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen message="Loading file information..." />;
  }

  if (error && !fileInfo) {
    return (
      <div className="public-download-container">
        <div className="public-download-card error-card">
          <div className="error-icon">❌</div>
          <h1>Error</h1>
          <p>{error}</p>
          <a href="/" className="btn-home">Go to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="public-download-container">
      <div className="public-download-card">
        <div className="file-icon-large">📄</div>

        <h1 className="file-title">{fileInfo.filename}</h1>

        {fileInfo.description && (
          <p className="file-description">{fileInfo.description}</p>
        )}

        <div className="file-details">
          <div className="detail-item">
            <span className="detail-label">File Size:</span>
            <span className="detail-value">{formatFileSize(fileInfo.fileSize)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{fileInfo.mimeType}</span>
          </div>
          {fileInfo.expiresAt && (
            <div className="detail-item">
              <span className="detail-label">Expires:</span>
              <span className="detail-value">{formatDate(fileInfo.expiresAt)}</span>
            </div>
          )}
          {fileInfo.maxDownloads && (
            <div className="detail-item">
              <span className="detail-label">Downloads:</span>
              <span className="detail-value">
                {fileInfo.downloadCount} / {fileInfo.maxDownloads}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleDownload} className="download-form">
          {showPasswordInput && (
            <div className="form-group">
              <label htmlFor="password">Password Required</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to download"
                disabled={downloading}
                className="password-input"
                autoFocus
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={downloading || (showPasswordInput && !password)}
            className="btn-download"
          >
            {downloading ? (
              <>
                <span className="spinner"></span>
                Downloading...
              </>
            ) : (
              <>
                ⬇ Download File
              </>
            )}
          </button>
        </form>

        <div className="powered-by">
          <p>Powered by ForumFiles</p>
        </div>
      </div>
    </div>
  );
};

export default PublicDownload;
