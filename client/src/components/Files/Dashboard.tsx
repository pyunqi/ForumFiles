import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getMyFiles, FileInfo } from '../../api/files';
import FileUpload from './FileUpload';
import FileList from './FileList';
import Loading from '../Common/Loading';
import Header from '../Common/Header';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showError } = useToast();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadFiles();
  }, [page]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await getMyFiles(page, 20);
      setFiles(response.files);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1) {
    return <Loading fullScreen message="Loading your files..." />;
  }

  return (
    <>
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>My Files</h1>
            <p className="dashboard-subtitle">
              Welcome back, {user?.email}
            </p>
          </div>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-value">{files.length}</div>
              <div className="stat-label">Files</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {files.reduce((sum, f) => sum + f.downloadCount, 0)}
              </div>
              <div className="stat-label">Downloads</div>
            </div>
          </div>
        </div>

        <FileUpload onUploadComplete={loadFiles} />

        <FileList
          files={files}
          onFileDeleted={loadFiles}
          showActions={true}
        />

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-pagination"
            >
              Previous
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-pagination"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
