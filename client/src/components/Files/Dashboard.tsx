import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getPublicFiles, downloadPublicFile, PublicFileInfo } from '../../api/files';
import { formatFileSize, formatDate } from '../../utils/formatters';
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
            {isAuthenticated ? (
              <>
                <Link to="/upload" className="btn-primary">
                  Upload File
                </Link>
                <Link to="/my-files" className="btn-secondary">
                  My Files
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn-secondary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="files-section">
          <h2>Available Downloads</h2>
          {files.length === 0 ? (
            <div className="empty-state">
              <p>No files available for download yet.</p>
            </div>
          ) : (
            <div className="public-files-list">
              {files.map((file) => (
                <div key={file.id} className="public-file-card">
                  <div className="file-icon">📄</div>
                  <div className="file-info">
                    <h3 className="file-name">{file.filename}</h3>
                    {file.description && (
                      <p className="file-description">{file.description}</p>
                    )}
                    <div className="file-meta">
                      <span className="file-size">{formatFileSize(file.fileSize)}</span>
                      <span className="file-date">{formatDate(file.createdAt)}</span>
                      <span className="file-downloads">{file.downloadCount} downloads</span>
                    </div>
                  </div>
                  <button
                    className="btn-download"
                    onClick={() => handleDownload(file)}
                    disabled={downloading === file.id}
                  >
                    {downloading === file.id ? 'Downloading...' : 'Download'}
                  </button>
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
