import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getPublicFiles, downloadPublicFile, PublicFileInfo } from '../../api/files';
import { formatFileSize } from '../../utils/formatters';
import Loading from '../Common/Loading';
import Header from '../Common/Header';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToast();
  const [files, setFiles] = useState<PublicFileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    loadPublicFiles();
  }, []);

  const loadPublicFiles = async () => {
    setLoading(true);
    try {
      const response = await getPublicFiles();
      setFiles(response.files);
    } catch (error) {
      // Don't show error for public files - just show empty state
      console.error('Failed to load files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Get file extension
  const getFileExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    return ext;
  };

  // Format date as YYYY-MM-DD
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleDownload = async (file: PublicFileInfo) => {
    setDownloading(file.id);
    try {
      await downloadPublicFile(file.id, file.filename);
      showSuccess('Download started');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return <Loading fullScreen message="Loading files..." />;
  }

  return (
    <>
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>File Downloads</h1>
            <p className="dashboard-subtitle">
              {isAuthenticated ? `Welcome, ${user?.email}` : 'Download available files'}
            </p>
          </div>
          <div className="dashboard-actions">
            <Link to="/upload" className="btn-primary">
              Upload File
            </Link>
            <Link to="/my-files" className="btn-secondary">
              My Files
            </Link>
          </div>
        </div>

        <div className="files-section">
          <h2>Available Downloads</h2>
          {files.length === 0 ? (
            <div className="empty-state">
              <p>No files available for download yet.</p>
            </div>
          ) : (
            <div className="public-files-grid">
              {files.map((file) => (
                <div key={file.id} className="file-card">
                  {/* Header with file name */}
                  <div className="file-card-header">
                    <h3 className="file-card-name">{file.filename}</h3>
                    <p className="file-card-meta">{getFileExtension(file.filename)} · {formatFileSize(file.fileSize)}</p>
                  </div>

                  {/* Body */}
                  <div className="file-card-body">
                    {/* Stats cards */}
                    <div className="file-stats-row">
                      <div className="file-stat-card">
                        <span className="file-stat-label">Downloads</span>
                        <span className="file-stat-value">{file.downloadCount?.toLocaleString() || 0}</span>
                      </div>
                      <div className="file-stat-card">
                        <span className="file-stat-label">Upload Date</span>
                        <span className="file-stat-value">{formatDateShort(file.createdAt)}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {file.description && (
                      <p className="file-card-description">{file.description}</p>
                    )}

                    {/* Download button */}
                    <button
                      className="file-card-download-btn"
                      onClick={() => handleDownload(file)}
                      disabled={downloading === file.id}
                    >
                      {downloading === file.id ? 'Downloading...' : 'Download File'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
