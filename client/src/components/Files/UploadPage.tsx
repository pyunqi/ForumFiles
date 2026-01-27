import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Common/Header';
import FileUpload from './FileUpload';
import './UploadPage.css';

const UploadPage: React.FC = () => {
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

        <FileUpload onUploadComplete={() => {
          // Optionally show success message or redirect
        }} />

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
