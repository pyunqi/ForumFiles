import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { uploadFile } from '../../api/files';
import { validateFileSize } from '../../utils/validators';
import Header from '../Common/Header';
import './UploadPage.css';

const TITLE_OPTIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
const PRESENTATION_TYPES = ['Oral Presentation', 'Poster Presentation', 'Virtual Presentation'];

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, register } = useAuth();
  const { showSuccess, showError } = useToast();

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Personal & Contact Information
  const [authorTitle, setAuthorTitle] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [affiliations, setAffiliations] = useState('');
  const [country, setCountry] = useState('');
  const [isCorrespondent, setIsCorrespondent] = useState(false);
  const [isPresenter, setIsPresenter] = useState(false);

  // Abstract Details
  const [abstractTitle, setAbstractTitle] = useState('');
  const [keyword, setKeyword] = useState('');

  // Presentation Type
  const [presentationType, setPresentationType] = useState('');

  // File Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // UI state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validation = validateFileSize(file, 50);
      if (!validation.isValid) {
        showError(validation.error!);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const validation = validateFileSize(file, 50);
      if (!validation.isValid) {
        showError(validation.error!);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!authorTitle || !authorEmail || !firstName || !lastName || !affiliations || !country) {
      showError('Please fill in all required personal information fields');
      return;
    }

    if (!abstractTitle || !keyword) {
      showError('Please fill in all required abstract details');
      return;
    }

    if (!presentationType) {
      showError('Please select a presentation type');
      return;
    }

    if (!selectedFile) {
      showError('Please select a file to upload');
      return;
    }

    if (!agreedToTerms) {
      showError('Please agree to the terms and conditions');
      return;
    }

    // If not logged in, need to register or login first
    if (!isAuthenticated) {
      if (!email || !password) {
        showError('Please enter email and password');
        return;
      }

      if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
      }

      setProcessing(true);

      try {
        await register({ email, password });
        showSuccess('Account created successfully');
      } catch (registerError: any) {
        const regErrorMessage = registerError?.message || '';

        if (regErrorMessage.includes('already registered')) {
          try {
            await login({ email, password });
          } catch (loginError: any) {
            showError('Please login first. Redirecting to login page...');
            setProcessing(false);
            setTimeout(() => {
              navigate('/login');
            }, 1500);
            return;
          }
        } else {
          showError(regErrorMessage || 'Registration failed');
          setProcessing(false);
          return;
        }
      }

      setProcessing(false);
    }

    // Build description with all form data
    const description = JSON.stringify({
      personalInfo: {
        title: authorTitle,
        email: authorEmail,
        firstName,
        lastName,
        affiliations,
        country,
        isCorrespondent,
        isPresenter,
      },
      abstractDetails: {
        title: abstractTitle,
        keyword,
      },
      presentationType,
    });

    // Upload the file
    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadFile(selectedFile, description, (progress) => {
        setUploadProgress(progress);
      });
      showSuccess('File uploaded successfully!');

      setTimeout(() => {
        navigate('/my-files');
      }, 1000);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const isDisabled = uploading || processing;

  return (
    <>
      <Header />
      <div className="upload-page-container">
        <div className="upload-page-header">
          <Link to="/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
          <h1>Submit Abstract</h1>
          <p>Please fill in all required fields and upload your abstract document.</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form-card">
          {/* Auth section - only show if not logged in */}
          {!isAuthenticated && (
            <div className="form-section">
              <h3>Account Information</h3>
              <p className="section-hint">New user? Just enter email and set a password. Existing user? Enter your credentials.</p>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                    disabled={isDisabled}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    autoComplete="current-password"
                    required
                    disabled={isDisabled}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 1. Personal & Contact Information */}
          <div className="form-section">
            <h3>1. Personal & Contact Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="authorTitle">Author 1 Title *</label>
                <select
                  id="authorTitle"
                  value={authorTitle}
                  onChange={(e) => setAuthorTitle(e.target.value)}
                  required
                  disabled={isDisabled}
                >
                  <option value="">Select...</option>
                  {TITLE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="authorEmail">Author 1 Email *</label>
                <input
                  id="authorEmail"
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  required
                  disabled={isDisabled}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Author 1 First Name *</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isDisabled}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Author 1 Last Name *</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isDisabled}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="affiliations">Author 1 Affiliations *</label>
                <input
                  id="affiliations"
                  type="text"
                  value={affiliations}
                  onChange={(e) => setAffiliations(e.target.value)}
                  required
                  disabled={isDisabled}
                />
              </div>
              <div className="form-group">
                <label htmlFor="country">Author 1 Country *</label>
                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  disabled={isDisabled}
                />
              </div>
            </div>

            <div className="form-row checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isCorrespondent}
                  onChange={(e) => setIsCorrespondent(e.target.checked)}
                  disabled={isDisabled}
                />
                <span>Author 1 Correspondent</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPresenter}
                  onChange={(e) => setIsPresenter(e.target.checked)}
                  disabled={isDisabled}
                />
                <span>Author 1 Presenter</span>
              </label>
            </div>
          </div>

          {/* 2. Abstract Details */}
          <div className="form-section">
            <h3>2. Abstract Details</h3>
            <div className="form-group">
              <label htmlFor="abstractTitle">Title of Abstract *</label>
              <input
                id="abstractTitle"
                type="text"
                value={abstractTitle}
                onChange={(e) => setAbstractTitle(e.target.value)}
                required
                disabled={isDisabled}
              />
            </div>
            <div className="form-group" style={{ maxWidth: '300px' }}>
              <label htmlFor="keyword">Keyword 1 *</label>
              <input
                id="keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                required
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* 3. Presentation Type */}
          <div className="form-section">
            <h3>3. Presentation Type</h3>
            <div className="form-group">
              <select
                id="presentationType"
                value={presentationType}
                onChange={(e) => setPresentationType(e.target.value)}
                required
                disabled={isDisabled}
              >
                <option value="">Select presentation type...</option>
                {PRESENTATION_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. File Uploads */}
          <div className="form-section">
            <h3>4. File Uploads</h3>
            <label className="file-label">Abstract document</label>
            <div
              className={`file-drop-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={isDisabled}
                style={{ display: 'none' }}
              />
              {selectedFile ? (
                <div className="selected-file">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button
                    type="button"
                    className="btn-remove-file"
                    onClick={() => setSelectedFile(null)}
                    disabled={isDisabled}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <span className="folder-icon">📁</span>
                  <p>Drag & drop a file or <button type="button" className="btn-browse" onClick={handleBrowseClick} disabled={isDisabled}>browse</button></p>
                </div>
              )}
            </div>
          </div>

          {/* Agreement */}
          <div className="form-section agreement-section">
            <label className="checkbox-label agreement-checkbox">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={isDisabled}
              />
              <span>
                I confirm that my submission is original, aligns with the scope of IYLF 2026,
                will be used for presentation and academic purposes. I also agree to the
                Forum's review process and participation requirements. *
              </span>
            </label>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="btn-upload-submit"
            disabled={isDisabled}
          >
            {processing ? 'Processing...' : uploading ? 'Uploading...' : 'Submit'}
          </button>
        </form>

        <div className="upload-page-footer">
          <Link to="/my-files" className="btn-secondary">
            View My Files
          </Link>
        </div>
      </div>
    </>
  );
};

export default UploadPage;
