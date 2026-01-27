import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { uploadFile } from '../../api/files';
import { validateFileSize } from '../../utils/validators';
import Header from '../Common/Header';
import './UploadPage.css';

const UploadPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const { showSuccess, showError } = useToast();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  // UI state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loggingIn, setLoggingIn] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      showError('Please select a file');
      return;
    }

    // If not logged in, need to login/register first
    if (!isAuthenticated) {
      if (!email || !password) {
        showError('Please enter email and password');
        return;
      }

      setLoggingIn(true);
      try {
        // Try to login first
        await login({ email, password });
      } catch (error) {
        // If login fails, it might be a new user - show error
        showError('Login failed. If you are a new user, please register first at My Files page.');
        setLoggingIn(false);
        return;
      }
      setLoggingIn(false);
    }

    // Now upload the file
    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadFile(selectedFile, description, (progress) => {
        setUploadProgress(progress);
      });
      showSuccess('File uploaded successfully!');

      // Reset form
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      <div className="upload-page-container">
        <div className="upload-page-header">
          <Link to="/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
          <h1>Upload File</h1>
          <p>Upload your files here. Maximum file size: 50MB</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form-card">
          {/* Show login fields if not authenticated */}
          {!isAuthenticated && (
            <div className="auth-section">
              <h3>Login to Upload</h3>
              <p className="auth-hint">Enter your email and password to upload files</p>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={uploading || loggingIn}
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
                  disabled={uploading || loggingIn}
                />
              </div>
              <p className="register-hint">
                New user? <Link to="/my-files">Register here</Link> first.
              </p>
            </div>
          )}

          {/* File selection */}
          <div className="file-section">
            <h3>Select File</h3>
            <div className="form-group">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={uploading || loggingIn}
              />
              {selectedFile && (
                <p className="selected-file-info">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this file..."
                rows={3}
                disabled={uploading || loggingIn}
              />
            </div>
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
            disabled={uploading || loggingIn || !selectedFile}
          >
            {loggingIn ? 'Logging in...' : uploading ? 'Uploading...' : 'Upload File'}
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
