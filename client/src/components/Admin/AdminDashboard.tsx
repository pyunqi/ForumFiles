import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  getAllUsers,
  getAllFiles,
  toggleUserStatus,
  deleteFileAdmin,
  uploadPublicFile,
  getPublicFilesAdmin,
  deletePublicFile,
  AdminUser,
} from '../../api/admin';
import { FileInfo } from '../../api/files';
import { formatFileSize, formatDate } from '../../utils/formatters';
import Header from '../Common/Header';
import Loading from '../Common/Loading';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'userFiles' | 'publicFiles'>('publicFiles');

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // User files state
  const [userFiles, setUserFiles] = useState<FileInfo[]>([]);
  const [userFilesPage, setUserFilesPage] = useState(1);
  const [userFilesTotalPages, setUserFilesTotalPages] = useState(1);
  const [userFilesSearch, setUserFilesSearch] = useState('');
  const [loadingUserFiles, setLoadingUserFiles] = useState(false);

  // Public files state
  const [publicFiles, setPublicFiles] = useState<FileInfo[]>([]);
  const [loadingPublicFiles, setLoadingPublicFiles] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'userFiles') {
      loadUserFiles();
    } else {
      loadPublicFiles();
    }
  }, [activeTab, usersPage, userFilesPage]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await getAllUsers(usersPage, 20, usersSearch);
      setUsers(response.users);
      setUsersTotalPages(response.pagination.totalPages);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserFiles = async () => {
    setLoadingUserFiles(true);
    try {
      const response = await getAllFiles(userFilesPage, 20, userFilesSearch);
      setUserFiles(response.files);
      setUserFilesTotalPages(response.pagination.totalPages);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setLoadingUserFiles(false);
    }
  };

  const loadPublicFiles = async () => {
    setLoadingPublicFiles(true);
    try {
      const response = await getPublicFilesAdmin();
      setPublicFiles(response.files);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load public files');
    } finally {
      setLoadingPublicFiles(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await toggleUserStatus(userId, !currentStatus);
      showSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadUsers();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  const handleDeleteUserFile = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await deleteFileAdmin(fileId);
      showSuccess('File deleted successfully');
      loadUserFiles();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  const handleDeletePublicFile = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this public file?')) {
      return;
    }

    try {
      await deletePublicFile(fileId);
      showSuccess('Public file deleted successfully');
      loadPublicFiles();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadPublicFile = async () => {
    if (!selectedFile) {
      showError('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadPublicFile(selectedFile, fileDescription, (progress) => {
        setUploadProgress(progress);
      });
      showSuccess('Public file uploaded successfully');
      setSelectedFile(null);
      setFileDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadPublicFiles();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <Header />
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Manage users and files</p>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'publicFiles' ? 'active' : ''}`}
            onClick={() => setActiveTab('publicFiles')}
          >
            Public Files
          </button>
          <button
            className={`admin-tab ${activeTab === 'userFiles' ? 'active' : ''}`}
            onClick={() => setActiveTab('userFiles')}
          >
            User Files
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>

        {/* Public Files Tab */}
        {activeTab === 'publicFiles' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Public Files Management</h2>
              <p className="section-description">Upload files for users to download</p>
            </div>

            {/* Upload Form */}
            <div className="upload-form">
              <h3>Upload New Public File</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Select File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </div>
                <div className="form-group flex-grow">
                  <label>Description</label>
                  <input
                    type="text"
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder="Enter file description..."
                    disabled={uploading}
                  />
                </div>
                <button
                  onClick={handleUploadPublicFile}
                  disabled={uploading || !selectedFile}
                  className="btn-upload"
                >
                  {uploading ? `Uploading ${uploadProgress}%` : 'Upload'}
                </button>
              </div>
              {uploading && (
                <div className="upload-progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Public Files List */}
            {loadingPublicFiles ? (
              <Loading />
            ) : publicFiles.length === 0 ? (
              <div className="empty-state">
                <p>No public files uploaded yet.</p>
              </div>
            ) : (
              <div className="data-table">
                <div className="table-header">
                  <div className="table-cell">Filename</div>
                  <div className="table-cell">Description</div>
                  <div className="table-cell">Size</div>
                  <div className="table-cell">Downloads</div>
                  <div className="table-cell">Uploaded</div>
                  <div className="table-cell">Actions</div>
                </div>
                <div className="table-body">
                  {publicFiles.map((file) => (
                    <div key={file.id} className="table-row">
                      <div className="table-cell">{file.filename}</div>
                      <div className="table-cell">{file.description || '-'}</div>
                      <div className="table-cell">{formatFileSize(file.fileSize)}</div>
                      <div className="table-cell">{file.downloadCount}</div>
                      <div className="table-cell">{formatDate(file.createdAt)}</div>
                      <div className="table-cell">
                        <button
                          onClick={() => handleDeletePublicFile(file.id)}
                          className="btn-action btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Files Tab */}
        {activeTab === 'userFiles' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>User Files Management</h2>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search files..."
                  value={userFilesSearch}
                  onChange={(e) => setUserFilesSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadUserFiles()}
                />
                <button onClick={loadUserFiles} className="btn-search">Search</button>
              </div>
            </div>

            {loadingUserFiles ? (
              <Loading />
            ) : (
              <>
                <div className="data-table">
                  <div className="table-header">
                    <div className="table-cell">Filename</div>
                    <div className="table-cell">Owner</div>
                    <div className="table-cell">Size</div>
                    <div className="table-cell">Uploaded</div>
                    <div className="table-cell">Actions</div>
                  </div>
                  <div className="table-body">
                    {userFiles.map((file) => (
                      <div key={file.id} className="table-row">
                        <div className="table-cell">{file.filename}</div>
                        <div className="table-cell">{file.user?.email || 'Unknown'}</div>
                        <div className="table-cell">{formatFileSize(file.fileSize)}</div>
                        <div className="table-cell">{formatDate(file.createdAt)}</div>
                        <div className="table-cell">
                          <button
                            onClick={() => handleDeleteUserFile(file.id)}
                            className="btn-action btn-delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {userFilesTotalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setUserFilesPage(p => Math.max(1, p - 1))}
                      disabled={userFilesPage === 1}
                      className="btn-pagination"
                    >
                      Previous
                    </button>
                    <span className="page-info">
                      Page {userFilesPage} of {userFilesTotalPages}
                    </span>
                    <button
                      onClick={() => setUserFilesPage(p => Math.min(userFilesTotalPages, p + 1))}
                      disabled={userFilesPage === userFilesTotalPages}
                      className="btn-pagination"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>User Management</h2>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadUsers()}
                />
                <button onClick={loadUsers} className="btn-search">Search</button>
              </div>
            </div>

            {loadingUsers ? (
              <Loading />
            ) : (
              <>
                <div className="data-table">
                  <div className="table-header">
                    <div className="table-cell">Email</div>
                    <div className="table-cell">Role</div>
                    <div className="table-cell">Files</div>
                    <div className="table-cell">Storage</div>
                    <div className="table-cell">Status</div>
                    <div className="table-cell">Joined</div>
                    <div className="table-cell">Actions</div>
                  </div>
                  <div className="table-body">
                    {users.map((user) => (
                      <div key={user.id} className="table-row">
                        <div className="table-cell">{user.email}</div>
                        <div className="table-cell">
                          <span className={`badge badge-${user.role}`}>
                            {user.role}
                          </span>
                        </div>
                        <div className="table-cell">{user.filesCount}</div>
                        <div className="table-cell">{formatFileSize(user.totalFileSize)}</div>
                        <div className="table-cell">
                          <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="table-cell">{formatDate(user.createdAt)}</div>
                        <div className="table-cell">
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            className={`btn-action ${user.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {usersTotalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                      className="btn-pagination"
                    >
                      Previous
                    </button>
                    <span className="page-info">
                      Page {usersPage} of {usersTotalPages}
                    </span>
                    <button
                      onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))}
                      disabled={usersPage === usersTotalPages}
                      className="btn-pagination"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
