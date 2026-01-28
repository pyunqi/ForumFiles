import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Files/Dashboard';
import UploadPage from './components/Files/UploadPage';
import MyFiles from './components/Files/MyFiles';
import AdminDashboard from './components/Admin/AdminDashboard';
import PublicDownload from './components/Public/PublicDownload';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/public/:linkCode" element={<PublicDownload />} />

            {/* Dashboard - public, no login required */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Upload and My Files - handle auth inline */}
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/my-files" element={<MyFiles />} />

            {/* Admin route - handles its own login */}
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
