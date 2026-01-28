import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getMyFiles, deleteFile, FileInfo } from '../../api/files';
import { requestVerificationCode, verifyCodeLogin } from '../../api/auth';
import { formatFileSize, formatDate } from '../../utils/formatters';
import Loading from '../Common/Loading';
import Header from '../Common/Header';
import './MyFiles.css';

type LoginMethod = 'password' | 'code';

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
  // If not JSON or no abstract title, return original or dash
  return description || '-';
};

const MyFiles: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const { showError, showSuccess } = useToast();

  // Login form state
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeExpiry, setCodeExpiry] = useState(0);

  // Files state
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Modal state
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    }
  }, [isAuthenticated, page]);

  // Countdown timer for code expiry
  useEffect(() => {
    if (codeExpiry > 0) {
      const timer = setTimeout(() => setCodeExpiry(codeExpiry - 1), 1000);
      return () => clearTimeout(timer);
    } else if (codeExpiry === 0 && codeSent) {
      setCodeSent(false);
    }
  }, [codeExpiry, codeSent]);

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    setLoggingIn(true);
    try {
      await login({ email, password });
      showSuccess('Login successful');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSendCode = async () => {
    if (!email) {
      showError('Please enter your email');
      return;
    }

    setSendingCode(true);
    try {
      const response = await requestVerificationCode(email);
      setCodeSent(true);
      setCodeExpiry(response.expiresIn || 300);
      showSuccess('Verification code sent to your email');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !verificationCode) {
      showError('Please enter email and verification code');
      return;
    }

    setLoggingIn(true);
    try {
      const response = await verifyCodeLogin(email, verificationCode);
      // Store token and update auth state
      localStorage.setItem('token', response.token);
      window.location.reload(); // Reload to update auth context
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Login failed');
      setLoggingIn(false);
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

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="my-files-container">
          <div className="my-files-header">
            <Link to="/dashboard" className="back-link">
              ← Back to Dashboard
            </Link>
            <h1>My Files</h1>
            <p>Login to manage your files</p>
          </div>

          <div className="login-card">
            <div className="login-tabs">
              <button
                className={`login-tab ${loginMethod === 'password' ? 'active' : ''}`}
                onClick={() => setLoginMethod('password')}
              >
                Email & Password
              </button>
              <button
                className={`login-tab ${loginMethod === 'code' ? 'active' : ''}`}
                onClick={() => setLoginMethod('code')}
              >
                Email & Code
              </button>
            </div>

            {loginMethod === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
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
                    required
                    disabled={loggingIn}
                  />
                </div>
                <button type="submit" className="btn-login" disabled={loggingIn}>
                  {loggingIn ? 'Logging in...' : 'Login'}
                </button>
                <p className="register-hint">
                  New user? <Link to="/register">Register here</Link> first.
                </p>
              </form>
            ) : (
              <form onSubmit={handleCodeLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="email-code">Email</label>
                  <input
                    id="email-code"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={loggingIn || sendingCode}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="code">Verification Code</label>
                  <div className="code-input-group">
                    <input
                      id="code"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      required
                      disabled={loggingIn}
                      maxLength={6}
                    />
                    <button
                      type="button"
                      className="btn-send-code"
                      onClick={handleSendCode}
                      disabled={sendingCode || (codeSent && codeExpiry > 0)}
                    >
                      {sendingCode ? 'Sending...' : codeSent && codeExpiry > 0 ? `Resend (${codeExpiry}s)` : 'Send Code'}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn-login" disabled={loggingIn || !codeSent}>
                  {loggingIn ? 'Logging in...' : 'Login with Code'}
                </button>
                <p className="register-hint">
                  New user? <Link to="/register">Register here</Link> first.
                </p>
              </form>
            )}
          </div>
        </div>
      </>
    );
  }

  // Show loading when fetching files
  if (loading && page === 1) {
    return <Loading fullScreen message="Loading your files..." />;
  }

  // Show files list when authenticated
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
                <div className="table-cell">Description</div>
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
                    <div className="table-cell description-cell">
                      <span className="description-text">{getDisplayTitle(file.description)}</span>
                      {parseDescription(file.description) && (
                        <button
                          className="btn-details"
                          onClick={() => setSelectedFile(file)}
                        >
                          Details
                        </button>
                      )}
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

        {/* Details Modal */}
        {selectedFile && (
          <div className="modal-overlay" onClick={() => setSelectedFile(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Submission Details</h2>
                <button className="modal-close" onClick={() => setSelectedFile(null)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                {(() => {
                  const parsed = parseDescription(selectedFile.description);
                  if (!parsed) return <p>No details available</p>;

                  return (
                    <>
                      <div className="detail-section">
                        <h4>File Information</h4>
                        <div className="detail-row">
                          <span className="detail-label">Filename:</span>
                          <span className="detail-value">{selectedFile.filename}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Size:</span>
                          <span className="detail-value">{formatFileSize(selectedFile.fileSize)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Uploaded:</span>
                          <span className="detail-value">{formatDate(selectedFile.createdAt)}</span>
                        </div>
                      </div>

                      {parsed.personalInfo && (
                        <div className="detail-section">
                          <h4>Personal & Contact Information</h4>
                          <div className="detail-row">
                            <span className="detail-label">Name:</span>
                            <span className="detail-value">
                              {parsed.personalInfo.title} {parsed.personalInfo.firstName} {parsed.personalInfo.lastName}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value">{parsed.personalInfo.email}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Affiliations:</span>
                            <span className="detail-value">{parsed.personalInfo.affiliations}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Country:</span>
                            <span className="detail-value">{parsed.personalInfo.country}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Role:</span>
                            <span className="detail-value">
                              {[
                                parsed.personalInfo.isCorrespondent && 'Correspondent',
                                parsed.personalInfo.isPresenter && 'Presenter',
                              ].filter(Boolean).join(', ') || '-'}
                            </span>
                          </div>
                        </div>
                      )}

                      {parsed.abstractDetails && (
                        <div className="detail-section">
                          <h4>Abstract Details</h4>
                          <div className="detail-row">
                            <span className="detail-label">Title:</span>
                            <span className="detail-value">{parsed.abstractDetails.title}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Keyword:</span>
                            <span className="detail-value">{parsed.abstractDetails.keyword}</span>
                          </div>
                        </div>
                      )}

                      {parsed.presentationType && (
                        <div className="detail-section">
                          <h4>Presentation</h4>
                          <div className="detail-row">
                            <span className="detail-label">Type:</span>
                            <span className="detail-value">{parsed.presentationType}</span>
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
    </>
  );
};

export default MyFiles;
