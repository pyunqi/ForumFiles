import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getAllUsers,
  getAllFiles,
  exportAllFiles,
  deleteFileAdmin,
  toggleUserStatus,
  deleteUser,
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

type TabType = 'publicFiles' | 'userFiles' | 'users' | 'admins';

// Type for parsed description
interface ParsedDescription {
  personalInfo?: {
    title?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    affiliations?: string;
    country?: string;
    isCorrespondent?: boolean;
    isPresenter?: boolean;
  };
  abstractDetails?: {
    title?: string;
    keyword?: string;
  };
  presentationType?: string;
}

// Helper to parse description JSON
const parseDescription = (description: string | null): ParsedDescription | null => {
  if (!description) return null;
  try {
    return JSON.parse(description);
  } catch {
    return null;
  }
};

// Get display title from description
const getDisplayTitle = (description: string | null): string => {
  const parsed = parseDescription(description);
  if (parsed?.abstractDetails?.title) {
    return parsed.abstractDetails.title;
  }
  return description || '-';
};

const AdminDashboard: React.FC = () => {
  const { isAuthenticated, user, login } = useAuth();
  const { showSuccess, showError } = useToast();

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('publicFiles');

  // Public files state
  const [publicFiles, setPublicFiles] = useState<FileInfo[]>([]);
  const [loadingPublicFiles, setLoadingPublicFiles] = useState(false);

  // User files state
  const [userFiles, setUserFiles] = useState<FileInfo[]>([]);
  const [userFilesPage, setUserFilesPage] = useState(1);
  const [userFilesTotalPages, setUserFilesTotalPages] = useState(1);
  const [userFilesSearch, setUserFilesSearch] = useState('');
  const [loadingUserFiles, setLoadingUserFiles] = useState(false);
  const [deletingFile, setDeletingFile] = useState<number | null>(null);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState<FileInfo | null>(null);
  const [exporting, setExporting] = useState(false);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Admins state
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Add admin search state
  const [addAdminSearch, setAddAdminSearch] = useState('');
  const [addAdminResults, setAddAdminResults] = useState<AdminUser[]>([]);
  const [loadingAddAdmin, setLoadingAddAdmin] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = isAuthenticated && user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadDataForTab(activeTab);
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (isAdmin && activeTab === 'userFiles') {
      loadUserFiles();
    }
  }, [userFilesPage]);

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      loadUsers();
    }
  }, [usersPage]);

  const loadDataForTab = (tab: TabType) => {
    switch (tab) {
      case 'publicFiles':
        loadPublicFiles();
        break;
      case 'userFiles':
        loadUserFiles();
        break;
      case 'users':
        loadUsers();
        break;
      case 'admins':
        loadAdmins();
        break;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    setLoggingIn(true);
    try {
      await login({ email, password });
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

  const loadUserFiles = async () => {
    setLoadingUserFiles(true);
    try {
      const response = await getAllFiles(userFilesPage, 20, userFilesSearch);
      setUserFiles(response.files);
      setUserFilesTotalPages(response.pagination.totalPages);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load user files');
    } finally {
      setLoadingUserFiles(false);
    }
  };

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

  const searchUsersForAdmin = async () => {
    if (!addAdminSearch.trim()) {
      showError('Please enter an email to search');
      return;
    }

    setLoadingAddAdmin(true);
    try {
      const response = await getAllUsers(1, 10, addAdminSearch);
      setAddAdminResults(response.users.filter(u => u.role !== 'admin'));
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to search users');
    } finally {
      setLoadingAddAdmin(false);
    }
  };

  const handleSetAdmin = async (userId: number) => {
    try {
      await setUserAsAdmin(userId);
      showSuccess('User is now an admin');
      setShowAddAdmin(false);
      setAddAdminSearch('');
      setAddAdminResults([]);
      loadAdmins();
      loadUsers();
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
      loadUsers();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to remove admin');
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

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${email}"? This will also delete all their files.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      showSuccess('User deleted successfully');
      loadUsers();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleDeleteUserFile = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setDeletingFile(fileId);
    try {
      await deleteFileAdmin(fileId);
      showSuccess('File deleted successfully');
      loadUserFiles();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete file');
    } finally {
      setDeletingFile(null);
    }
  };

  const handleExportToExcel = async () => {
    setExporting(true);
    try {
      const response = await exportAllFiles(userFilesSearch);
      const files = response.files;

      // Prepare data for Excel
      const excelData = files.map((file) => {
        const parsed = parseDescription(file.description);

        return {
          'Filename': file.filename,
          'Owner Email': file.user?.email || 'Unknown',
          'File Size': formatFileSize(file.fileSize),
          'Upload Date': formatDate(file.createdAt),
          'Author Title': parsed?.personalInfo?.title || '',
          'Author Email': parsed?.personalInfo?.email || '',
          'First Name': parsed?.personalInfo?.firstName || '',
          'Last Name': parsed?.personalInfo?.lastName || '',
          'Affiliations': parsed?.personalInfo?.affiliations || '',
          'Country': parsed?.personalInfo?.country || '',
          'Is Correspondent': parsed?.personalInfo?.isCorrespondent ? 'Yes' : 'No',
          'Is Presenter': parsed?.personalInfo?.isPresenter ? 'Yes' : 'No',
          'Abstract Title': parsed?.abstractDetails?.title || '',
          'Keyword': parsed?.abstractDetails?.keyword || '',
          'Presentation Type': parsed?.presentationType || '',
        };
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'User Files');

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(excelData[0] || {}).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...excelData.map((row) => String(row[key as keyof typeof row] || '').length)
        );
        return { wch: Math.min(maxLen + 2, maxWidth) };
      });
      worksheet['!cols'] = colWidths;

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `user-files-export-${date}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);
      showSuccess(`Exported ${files.length} files to Excel`);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to export files');
    } finally {
      setExporting(false);
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
          className={`admin-tab ${activeTab === 'userFiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('userFiles')}
        >
          User Files
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Accounts
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
              <div className="table-header public-files-header">
                <div className="table-cell">Filename</div>
                <div className="table-cell">Description</div>
                <div className="table-cell">Size</div>
                <div className="table-cell">Downloads</div>
                <div className="table-cell">Uploaded</div>
                <div className="table-cell">Actions</div>
              </div>
              <div className="table-body">
                {publicFiles.map((file) => (
                  <div key={file.id} className="table-row public-files-row">
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
                placeholder="Search by filename..."
                value={userFilesSearch}
                onChange={(e) => setUserFilesSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadUserFiles()}
              />
              <button onClick={loadUserFiles} className="btn-search">Search</button>
              <button
                onClick={handleExportToExcel}
                className="btn-export"
                disabled={exporting}
              >
                {exporting ? 'Exporting...' : 'Export to Excel'}
              </button>
            </div>
          </div>

          {loadingUserFiles ? (
            <Loading />
          ) : userFiles.length === 0 ? (
            <div className="empty-state">
              <p>No user files found.</p>
            </div>
          ) : (
            <>
              <div className="data-table">
                <div className="table-header user-files-header">
                  <div className="table-cell">Filename</div>
                  <div className="table-cell">Description</div>
                  <div className="table-cell">Owner</div>
                  <div className="table-cell">Size</div>
                  <div className="table-cell">Uploaded</div>
                  <div className="table-cell">Actions</div>
                </div>
                <div className="table-body">
                  {userFiles.map((file) => (
                    <div key={file.id} className="table-row user-files-row">
                      <div className="table-cell">{file.filename}</div>
                      <div className="table-cell description-cell">
                        <span className="description-text">{getDisplayTitle(file.description)}</span>
                        {parseDescription(file.description) && (
                          <button
                            className="btn-details"
                            onClick={() => setSelectedFileForDetails(file)}
                          >
                            Details
                          </button>
                        )}
                      </div>
                      <div className="table-cell">{file.user?.email || 'Unknown'}</div>
                      <div className="table-cell">{formatFileSize(file.fileSize)}</div>
                      <div className="table-cell">{formatDate(file.createdAt)}</div>
                      <div className="table-cell">
                        <button
                          onClick={() => handleDeleteUserFile(file.id)}
                          className="btn-action btn-delete"
                          disabled={deletingFile === file.id}
                        >
                          {deletingFile === file.id ? 'Deleting...' : 'Delete'}
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

      {/* User Accounts Tab */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>User Accounts Management</h2>
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
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No users found.</p>
            </div>
          ) : (
            <>
              <div className="data-table">
                <div className="table-header users-header">
                  <div className="table-cell">Email</div>
                  <div className="table-cell">Role</div>
                  <div className="table-cell">Files</div>
                  <div className="table-cell">Storage</div>
                  <div className="table-cell">Status</div>
                  <div className="table-cell">Joined</div>
                  <div className="table-cell">Actions</div>
                </div>
                <div className="table-body">
                  {users.map((u) => (
                    <div key={u.id} className="table-row users-row">
                      <div className="table-cell">{u.email}</div>
                      <div className="table-cell">
                        <span className={`badge badge-${u.role}`}>
                          {u.role}
                        </span>
                      </div>
                      <div className="table-cell">{u.filesCount}</div>
                      <div className="table-cell">{formatFileSize(u.totalFileSize)}</div>
                      <div className="table-cell">
                        <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="table-cell">{formatDate(u.createdAt)}</div>
                      <div className="table-cell actions-cell">
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                          className={`btn-action ${u.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="btn-action btn-delete"
                        >
                          Delete
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

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Admin Management</h2>
            <button
              className="btn-add-admin"
              onClick={() => setShowAddAdmin(!showAddAdmin)}
            >
              {showAddAdmin ? 'Cancel' : '+ Add Admin'}
            </button>
          </div>

          {/* Add Admin Search */}
          {showAddAdmin && (
            <div className="add-admin-form">
              <h3>Add New Admin</h3>
              <p>Search for a user by email to make them an admin</p>
              <div className="search-row">
                <input
                  type="text"
                  value={addAdminSearch}
                  onChange={(e) => setAddAdminSearch(e.target.value)}
                  placeholder="Enter user email..."
                  onKeyPress={(e) => e.key === 'Enter' && searchUsersForAdmin()}
                />
                <button onClick={searchUsersForAdmin} disabled={loadingAddAdmin} className="btn-search">
                  {loadingAddAdmin ? 'Searching...' : 'Search'}
                </button>
              </div>

              {addAdminResults.length > 0 && (
                <div className="search-results">
                  {addAdminResults.map((u) => (
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

      {/* File Details Modal */}
      {selectedFileForDetails && (
        <div className="modal-overlay" onClick={() => setSelectedFileForDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submission Details</h2>
              <button className="modal-close" onClick={() => setSelectedFileForDetails(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {/* File Information */}
              <div className="detail-section">
                <h4>File Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Filename</span>
                    <span className="detail-value">{selectedFileForDetails.filename}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Owner</span>
                    <span className="detail-value">{selectedFileForDetails.user?.email || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Size</span>
                    <span className="detail-value">{formatFileSize(selectedFileForDetails.fileSize)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Uploaded</span>
                    <span className="detail-value">{formatDate(selectedFileForDetails.createdAt)}</span>
                  </div>
                </div>
              </div>

              {(() => {
                const parsed = parseDescription(selectedFileForDetails.description);
                if (!parsed) return null;

                return (
                  <>
                    {/* 1. Personal & Contact Information */}
                    {parsed.personalInfo && (
                      <div className="detail-section">
                        <h4>1. Personal & Contact Information</h4>
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Author 1 Title</span>
                            <span className="detail-value">{parsed.personalInfo.title || '-'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Author 1 Email</span>
                            <span className="detail-value">{parsed.personalInfo.email || '-'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Author 1 First Name</span>
                            <span className="detail-value">{parsed.personalInfo.firstName || '-'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Author 1 Last Name</span>
                            <span className="detail-value">{parsed.personalInfo.lastName || '-'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Author 1 Affiliations</span>
                            <span className="detail-value">{parsed.personalInfo.affiliations || '-'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Author 1 Country</span>
                            <span className="detail-value">{parsed.personalInfo.country || '-'}</span>
                          </div>
                        </div>
                        <div className="detail-checkboxes">
                          <span className={`detail-checkbox ${parsed.personalInfo.isCorrespondent ? 'checked' : ''}`}>
                            {parsed.personalInfo.isCorrespondent ? '✓' : '○'} Author 1 Correspondent
                          </span>
                          <span className={`detail-checkbox ${parsed.personalInfo.isPresenter ? 'checked' : ''}`}>
                            {parsed.personalInfo.isPresenter ? '✓' : '○'} Author 1 Presenter
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 2. Abstract Details */}
                    {parsed.abstractDetails && (
                      <div className="detail-section">
                        <h4>2. Abstract Details</h4>
                        <div className="detail-grid single-column">
                          <div className="detail-item full-width">
                            <span className="detail-label">Title of Abstract</span>
                            <span className="detail-value">{parsed.abstractDetails.title || '-'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Keyword 1</span>
                            <span className="detail-value">{parsed.abstractDetails.keyword || '-'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Presentation Type */}
                    {parsed.presentationType && (
                      <div className="detail-section">
                        <h4>3. Presentation Type</h4>
                        <div className="detail-grid single-column">
                          <div className="detail-item">
                            <span className="detail-label">Type</span>
                            <span className="detail-value">{parsed.presentationType}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
