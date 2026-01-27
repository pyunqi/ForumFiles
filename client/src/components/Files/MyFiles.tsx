import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { getMyFiles, deleteFile, FileInfo } from '../../api/files';
import { formatFileSize, formatDate } from '../../utils/formatters';
import Loading from '../Common/Loading';
import Header from '../Common/Header';
import './MyFiles.css';

const MyFiles: React.FC = () => {
  const { showError, showSuccess } = useToast();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

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

  const handleDelete = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setDeleting(fileId);
    try {
      await deleteFile(fileId);
      showSuccess('File deleted successfully');
      loadFiles();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  if (loading && page === 1) {
    return <Loading fullScreen message="Loading your files..." />;
  }

  return (
    <>
      <Header />
      <div className="my-files-container">
        <div className="my-files-header">
          <Link to="/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
          <div className="header-content">
            <div>
              <h1>My Files</h1>
              <p>Manage your uploaded files</p>
            </div>
            <Link to="/upload" className="btn-primary">
              Upload New File
            </Link>
          </div>
        </div>

        {files.length === 0 ? (
          <div className="empty-state">
            <p>You haven't uploaded any files yet.</p>
            <Link to="/upload" className="btn-primary">
              Upload Your First File
            </Link>
          </div>
        ) : (
          <>
            <div className="files-table">
              <div className="table-header">
                <div className="table-cell">Filename</div>
                <div className="table-cell">Size</div>
                <div className="table-cell">Uploaded</div>
                <div className="table-cell">Actions</div>
              </div>
              <div className="table-body">
                {files.map((file) => (
                  <div key={file.id} className="table-row">
                    <div className="table-cell filename-cell">
                      <span className="file-icon">📄</span>
                      <span className="filename">{file.filename}</span>
                    </div>
                    <div className="table-cell">{formatFileSize(file.fileSize)}</div>
                    <div className="table-cell">{formatDate(file.createdAt)}</div>
                    <div className="table-cell">
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(file.id)}
                        disabled={deleting === file.id}
                      >
                        {deleting === file.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
          </>
        )}
      </div>
    </>
  );
};

export default MyFiles;
