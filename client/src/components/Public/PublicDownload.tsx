import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicLinkInfo, downloadPublicFile } from '../../api/public';
import { formatFileSize, formatDate } from '../../utils/formatters';
import Loading from '../Common/Loading';
import './PublicDownload.css';

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

      setError('');
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
          <div className="error-icon">!</div>
          <h1>Error</h1>
          <p>{error}</p>
          <a href="/" className="btn-home">Go to Home</a>
        </div>
      </div>
    );
  }

  const parsed = parseDescription(fileInfo?.description);

  return (
    <div className="public-download-container">
      <div className="public-download-card">
        {/* Main Download Section - Most Prominent */}
        <div className="download-main-section">
          <div className="download-file-display">
            <div className="file-icon-box">
              <span className="file-icon-large">📄</span>
            </div>
            <div className="file-details-box">
              <h1 className="file-title">{fileInfo.filename}</h1>
              <div className="file-meta-row">
                <span className="file-meta-item">{formatFileSize(fileInfo.fileSize)}</span>
                <span className="file-meta-divider">•</span>
                <span className="file-meta-item">{fileInfo.mimeType}</span>
              </div>
              {(fileInfo.expiresAt || fileInfo.maxDownloads) && (
                <div className="file-meta-row secondary">
                  {fileInfo.expiresAt && (
                    <span className="file-meta-item">Expires: {formatDate(fileInfo.expiresAt)}</span>
                  )}
                  {fileInfo.maxDownloads && (
                    <span className="file-meta-item">
                      Downloads: {fileInfo.downloadCount} / {fileInfo.maxDownloads}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Download Form - Directly Below File Info */}
          <form onSubmit={handleDownload} className="download-form">
            {showPasswordInput && (
              <div className="password-section">
                <label htmlFor="password">This file is password protected</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
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
                  <span className="download-arrow">↓</span>
                  Download File
                </>
              )}
            </button>
          </form>
        </div>

        {/* Submission Details Section - Secondary */}
        {parsed && (
          <div className="submission-details-section">
            <h2 className="section-header">Submission Details</h2>

            {/* Personal & Contact Information */}
            {parsed.personalInfo && (
              <div className="info-block">
                <h4>1. Personal & Contact Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Author 1 Title</span>
                    <span className="info-value">{parsed.personalInfo.title || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Author 1 Email</span>
                    <span className="info-value">{parsed.personalInfo.email || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Author 1 First Name</span>
                    <span className="info-value">{parsed.personalInfo.firstName || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Author 1 Last Name</span>
                    <span className="info-value">{parsed.personalInfo.lastName || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Author 1 Affiliations</span>
                    <span className="info-value">{parsed.personalInfo.affiliations || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Author 1 Country</span>
                    <span className="info-value">{parsed.personalInfo.country || '-'}</span>
                  </div>
                </div>
                <div className="info-checkboxes">
                  <span className={`info-checkbox ${parsed.personalInfo.isCorrespondent ? 'checked' : ''}`}>
                    {parsed.personalInfo.isCorrespondent ? '✓' : '○'} Author 1 Correspondent
                  </span>
                  <span className={`info-checkbox ${parsed.personalInfo.isPresenter ? 'checked' : ''}`}>
                    {parsed.personalInfo.isPresenter ? '✓' : '○'} Author 1 Presenter
                  </span>
                </div>
              </div>
            )}

            {/* Abstract Details */}
            {parsed.abstractDetails && (
              <div className="info-block">
                <h4>2. Abstract Details</h4>
                <div className="info-grid single-column">
                  <div className="info-item full-width">
                    <span className="info-label">Title of Abstract</span>
                    <span className="info-value">{parsed.abstractDetails.title || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Keyword 1</span>
                    <span className="info-value">{parsed.abstractDetails.keyword || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Presentation Type */}
            {parsed.presentationType && (
              <div className="info-block">
                <h4>3. Presentation Type</h4>
                <div className="info-grid single-column">
                  <div className="info-item">
                    <span className="info-label">Type</span>
                    <span className="info-value">{parsed.presentationType}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plain description - Only show if not JSON */}
        {!parsed && fileInfo.description && (
          <div className="submission-details-section">
            <h2 className="section-header">Description</h2>
            <p className="plain-description">{fileInfo.description}</p>
          </div>
        )}

        <div className="powered-by">
          <p>Powered by ForumFiles</p>
        </div>
      </div>
    </div>
  );
};

export default PublicDownload;
