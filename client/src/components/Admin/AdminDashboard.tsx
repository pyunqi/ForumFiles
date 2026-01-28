import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getAllUsers,
  uploadPublicFile,
  getPublicFilesAdmin,
  deletePublicFile,
  getAllAdmins,
  setUserAsAdmin,
  removeAdminRole,
  AdminUser,
  AdminInfo,
} from '../../api/admin';
import { FileInfo } from '../../api/files';
import { formatFileSize, formatDate } from '../../utils/formatters';
import Loading from '../Common/Loading';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { isAuthenticated, user, login } = useAuth();
  const { showSuccess, showError } = useToast();

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'publicFiles' | 'admins'>('publicFiles');

  // Public files state
  const [publicFiles, setPublicFiles] = useState<FileInfo[]>([]);
  const [loadingPublicFiles, setLoadingPublicFiles] = useState(false);

  // Admins state
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Users for adding admin
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = isAuthenticated && user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'publicFiles') {
        loadPublicFiles();
      } else {
        loadAdmins();
      }
    }
  }, [isAdmin, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    setLoggingIn(true);
    try {
      await login({ email, password });
      // Check if logged in user is admin after login
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoggingIn(false);
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

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const response = await getAllAdmins();
      setAdmins(response.admins);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load admins');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const searchUsers = async () => {
    if (!usersSearch.trim()) {
      showError('Please enter an email to search');
      return;
    }

    setLoadingUsers(true);
    try {
      const response = await getAllUsers(1, 10, usersSearch);
      setUsers(response.users.filter(u => u.role !== 'admin'));
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to search users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSetAdmin = async (userId: number) => {
    try {
      await setUserAsAdmin(userId);
      showSuccess('User is now an admin');
      setShowUserSearch(false);
      setUsersSearch('');
      setUsers([]);
      loadAdmins();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to set admin');
    }
  };

  const handleRemoveAdmin = async (adminId: number) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) {
      return;
    }

    try {
      await removeAdminRole(adminId);
      showSuccess('Admin role removed');
      loadAdmins();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to remove admin');
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

  // Show login form if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <h1>Admin Login</h1>
          <p>Enter your admin credentials to continue</p>

          {isAuthenticated && !isAdmin && (
            <div className="admin-warning">
              You are logged in as {user?.email} but this account does not have admin privileges.
            </div>
          )}

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
                disabled={loggingIn}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={loggingIn}
              />
            </div>
            <button type="submit" className="btn-admin-login" disabled={loggingIn}>
              {loggingIn ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome, {user?.email}</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'publicFiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('publicFiles')}
        >
          Public Files
        </button>
        <button
          className={`admin-tab ${activeTab === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveTab('admins')}
        >
          Manage Admins
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

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Admin Management</h2>
            <button
              className="btn-add-admin"
              onClick={() => setShowUserSearch(!showUserSearch)}
            >
              {showUserSearch ? 'Cancel' : '+ Add Admin'}
            </button>
          </div>

          {/* Add Admin Search */}
          {showUserSearch && (
            <div className="add-admin-form">
              <h3>Add New Admin</h3>
              <p>Search for a user by email to make them an admin</p>
              <div className="search-row">
                <input
                  type="text"
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  placeholder="Enter user email..."
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                />
                <button onClick={searchUsers} disabled={loadingUsers} className="btn-search">
                  {loadingUsers ? 'Searching...' : 'Search'}
                </button>
              </div>

              {users.length > 0 && (
                <div className="search-results">
                  {users.map((u) => (
                    <div key={u.id} className="search-result-item">
                      <span>{u.email}</span>
                      <button
                        onClick={() => handleSetAdmin(u.id)}
                        className="btn-make-admin"
                      >
                        Make Admin
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admins List */}
          {loadingAdmins ? (
            <Loading />
          ) : admins.length === 0 ? (
            <div className="empty-state">
              <p>No admins found.</p>
            </div>
          ) : (
            <div className="data-table">
              <div className="table-header admin-table-header">
                <div className="table-cell">Email</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Added</div>
                <div className="table-cell">Actions</div>
              </div>
              <div className="table-body">
                {admins.map((admin) => (
                  <div key={admin.id} className="table-row">
                    <div className="table-cell">
                      {admin.email}
                      {admin.id === user?.id && <span className="you-badge">(You)</span>}
                    </div>
                    <div className="table-cell">
                      <span className={`status-badge ${admin.isActive ? 'active' : 'inactive'}`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="table-cell">{formatDate(admin.createdAt)}</div>
                    <div className="table-cell">
                      {admin.id !== user?.id && (
                        <button
                          onClick={() => handleRemoveAdmin(admin.id)}
                          className="btn-action btn-remove-admin"
                        >
                          Remove Admin
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
