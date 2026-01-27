import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { requestVerificationCode, verifyCodeLogin } from '../../api/auth';
import { validateEmail, validatePassword, validateVerificationCode } from '../../utils/validators';
import Loading from '../Common/Loading';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loginMethod, setLoginMethod] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error!;
    }

    if (loginMethod === 'password') {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.error!;
      }
    } else {
      const codeValidation = validateVerificationCode(verificationCode);
      if (!codeValidation.isValid) {
        newErrors.verificationCode = codeValidation.error!;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setErrors({ email: emailValidation.error! });
      return;
    }

    setSendingCode(true);
    setErrors({});

    try {
      await requestVerificationCode(email);
      setCodeSent(true);
      showSuccess('Verification code sent to your email');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (loginMethod === 'password') {
        await login({ email, password });
      } else {
        const response = await verifyCodeLogin(email, verificationCode);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        window.location.href = '/dashboard';
      }

      showSuccess('Login successful');
      navigate('/dashboard');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Login to ForumFiles</h1>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${loginMethod === 'password' ? 'active' : ''}`}
            onClick={() => setLoginMethod('password')}
          >
            Password
          </button>
          <button
            className={`auth-tab ${loginMethod === 'code' ? 'active' : ''}`}
            onClick={() => setLoginMethod('code')}
          >
            Verification Code
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'error' : ''}
              disabled={loading}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          {loginMethod === 'password' ? (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'error' : ''}
                disabled={loading}
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="verificationCode">Verification Code</label>
                <div className="input-with-button">
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    className={errors.verificationCode ? 'error' : ''}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || codeSent}
                    className="btn-secondary"
                  >
                    {sendingCode ? 'Sending...' : codeSent ? 'Sent' : 'Send Code'}
                  </button>
                </div>
                {errors.verificationCode && (
                  <span className="error-message">{errors.verificationCode}</span>
                )}
              </div>
            </>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? <Loading size="small" /> : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
