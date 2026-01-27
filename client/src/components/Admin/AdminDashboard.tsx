import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  getAllUsers,
  getAllFiles,
  toggleUserStatus,
  deleteFileAdmin,
  shareFile,
  generatePublicLink,
  AdminUser,
} from '../../api/admin';
import { FileInfo } from '../../api/files';
import { formatFileSize, formatDate } from '../../utils/formatters';
import Header from '../Common/Header';
import Loading from '../Common/Loading';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'files'>('users');

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Files state
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filesPage, setFilesPage] = useState(1);
  const [filesTotalPages, setFilesTotalPages] = useState(1);
  const [filesSearch, setFilesSearch] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Share/Link modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [linkExpires, setLinkExpires] = useState<number>(24);
  const [linkMaxDownloads, setLinkMaxDownloads] = useState<number>(0);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [generatedPassword, setGeneratedPassword] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else {
      loadFiles();
    }
  }, [activeTab, usersPage, filesPage]);

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

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await getAllFiles(filesPage, 20, filesSearch);
      setFiles(response.files);
      setFilesTotalPages(response.pagination.totalPages);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setLoadingFiles(false);
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

  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await deleteFileAdmin(fileId);
      showSuccess('File deleted successfully');
      loadFiles();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  const handleShareFile = async () => {
    if (!selectedFile || !shareEmail) {
      showError('Please enter an email address');
      return;
    }

    try {
      await shareFile({
        fileId: selectedFile.id,
        recipientEmail: shareEmail,
        message: shareMessage,
      });
      showSuccess('File shared via email successfully');
      setShowShareModal(false);
      setShareEmail('');
      setShareMessage('');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to share file');
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedFile) return;

    try {
      const response = await generatePublicLink({
        fileId: selectedFile.id,
        expiresIn: linkExpires,
        maxDownloads: linkMaxDownloads > 0 ? linkMaxDownloads : undefined,
      });
      setGeneratedLink(response.link);
      setGeneratedPassword(response.password);
      showSuccess('Public link generated successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to generate link');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard');
  };

  const closeModals = () => {
    setShowShareModal(false);
    setShowLinkModal(false);
    setSelectedFile(null);
    setShareEmail('');
    setShareMessage('');
    setGeneratedLink('');
    setGeneratedPassword('');
    setLinkExpires(24);
    setLinkMaxDownloads(0);
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
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`admin-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files
          </button>
        </div>

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

        {activeTab === 'files' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>File Management</h2>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search files..."
                  value={filesSearch}
                  onChange={(e) => setFilesSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadFiles()}
                />
                <button onClick={loadFiles} className="btn-search">Search</button>
              </div>
            </div>

            {loadingFiles ? (
              <Loading />
            ) : (
              <>
                <div className="data-table">
                  <div className="table-header">
                    <div className="table-cell">Filename</div>
                    <div className="table-cell">Owner</div>
                    <div className="table-cell">Size</div>
                    <div className="table-cell">Downloads</div>
                    <div className="table-cell">Uploaded</div>
                    <div className="table-cell">Actions</div>
                  </div>
                  <div className="table-body">
                    {files.map((file) => (
                      <div key={file.id} className="table-row">
                        <div className="table-cell">{file.filename}</div>
                        <div className="table-cell">{file.user?.email || 'Unknown'}</div>
                        <div className="table-cell">{formatFileSize(file.fileSize)}</div>
                        <div className="table-cell">{file.downloadCount}</div>
                        <div className="table-cell">{formatDate(file.createdAt)}</div>
                        <div className="table-cell actions-cell">
                          <button
                            onClick={() => {
                              setSelectedFile(file);
                              setShowShareModal(true);
                            }}
                            className="btn-action btn-share"
                            title="Share via email"
                          >
                            📧
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFile(file);
                              setShowLinkModal(true);
                            }}
                            className="btn-action btn-link"
                            title="Generate public link"
                          >
                            🔗
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="btn-action btn-delete"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {filesTotalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setFilesPage(p => Math.max(1, p - 1))}
                      disabled={filesPage === 1}
                      className="btn-pagination"
                    >
                      Previous
                    </button>
                    <span className="page-info">
                      Page {filesPage} of {filesTotalPages}
                    </span>
                    <button
                      onClick={() => setFilesPage(p => Math.min(filesTotalPages, p + 1))}
                      disabled={filesPage === filesTotalPages}
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

        {/* Share via Email Modal */}
        {showShareModal && selectedFile && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Share File via Email</h2>
                <button className="modal-close" onClick={closeModals}>✕</button>
              </div>
              <div className="modal-body">
                <p className="modal-file-name">{selectedFile.filename}</p>
                <div className="form-group">
                  <label htmlFor="shareEmail">Recipient Email</label>
                  <input
                    id="shareEmail"
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="shareMessage">Message (optional)</label>
                  <textarea
                    id="shareMessage"
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="Add a message..."
                    rows={3}
                  />
                </div>
                <div className="modal-actions">
                  <button onClick={closeModals} className="btn-secondary">Cancel</button>
                  <button onClick={handleShareFile} className="btn-primary">Send</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Public Link Modal */}
        {showLinkModal && selectedFile && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Generate Public Link</h2>
                <button className="modal-close" onClick={closeModals}>✕</button>
              </div>
              <div className="modal-body">
                <p className="modal-file-name">{selectedFile.filename}</p>

                {!generatedLink ? (
                  <>
                    <div className="form-group">
                      <label htmlFor="linkExpires">Expires In</label>
                      <select
                        id="linkExpires"
                        value={linkExpires}
                        onChange={(e) => setLinkExpires(Number(e.target.value))}
                      >
                        <option value={24}>1 Day</option>
                        <option value={72}>3 Days</option>
                        <option value={168}>7 Days</option>
                        <option value={0}>Never</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="maxDownloads">Max Downloads (0 = unlimited)</label>
                      <input
                        id="maxDownloads"
                        type="number"
                        min="0"
                        value={linkMaxDownloads}
                        onChange={(e) => setLinkMaxDownloads(Number(e.target.value))}
                      />
                    </div>
                    <div className="modal-actions">
                      <button onClick={closeModals} className="btn-secondary">Cancel</button>
                      <button onClick={handleGenerateLink} className="btn-primary">Generate Link</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="link-generated">
                      <div className="form-group">
                        <label>Public Link</label>
                        <div className="input-with-button">
                          <input type="text" value={generatedLink} readOnly />
                          <button onClick={() => copyToClipboard(generatedLink)} className="btn-copy">
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Password (required for download)</label>
                        <div className="input-with-button">
                          <input type="text" value={generatedPassword} readOnly />
                          <button onClick={() => copyToClipboard(generatedPassword)} className="btn-copy">
                            Copy
                          </button>
                        </div>
                      </div>
                      <p className="info-text">
                        Share both the link and password with the recipient.
                      </p>
                    </div>
                    <div className="modal-actions">
                      <button onClick={closeModals} className="btn-primary">Done</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
