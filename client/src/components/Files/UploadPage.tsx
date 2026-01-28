import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { uploadFile } from '../../api/files';
import { validateFileSize } from '../../utils/validators';
import Header from '../Common/Header';
import './UploadPage.css';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, register } = useAuth();
  const { showSuccess, showError } = useToast();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      showError('Please select a file');
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

      // Try to register first (will auto-login if successful)
      try {
        await register({ email, password });
        showSuccess('Account created successfully');
        // Registration auto-logs in now, continue to upload
      } catch (registerError: any) {
        // Note: axios interceptor converts errors to plain Error objects with message
        const regErrorMessage = registerError?.message || '';

        if (regErrorMessage.includes('already registered')) {
          // User already exists, try to login silently
          try {
            await login({ email, password });
            // Login successful, continue to upload
          } catch (loginError: any) {
            // Wrong password - redirect to login page
            showError('Please login first. Redirecting to login page...');
            setProcessing(false);
            setTimeout(() => {
              navigate('/login');
            }, 1500);
            return;
          }
        } else {
          // Other registration error
          showError(regErrorMessage || 'Registration failed');
          setProcessing(false);
          return;
        }
      }

      setProcessing(false);
    }

    // Now upload the file
    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadFile(selectedFile, description, (progress) => {
        setUploadProgress(progress);
      });
      showSuccess('File uploaded successfully!');

      // Redirect to my files page
      setTimeout(() => {
        navigate('/my-files');
      }, 1000);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Upload failed');
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
          {/* Show auth fields if not authenticated */}
          {!isAuthenticated && (
            <div className="auth-section">
              <h3>Enter Your Information</h3>
              <p className="auth-hint">New user? Just enter email and set a password. Existing user? Enter your credentials.</p>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                  disabled={uploading || processing}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set or enter your password (min 6 characters)"
                  autoComplete="current-password"
                  required
                  disabled={uploading || processing}
                />
              </div>
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
                disabled={uploading || processing}
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
                disabled={uploading || processing}
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
            disabled={uploading || processing || !selectedFile}
          >
            {processing ? 'Processing...' : uploading ? 'Uploading...' : 'Upload File'}
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
