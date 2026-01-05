import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login, register, error, clearError } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    displayName: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: null }));
    clearError();
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setFormErrors({});
    clearError();
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Invalid email address';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      let result;

      if (mode === 'login') {
        result = await login(formData.username, formData.password);
      } else {
        result = await register(
          formData.username,
          formData.password,
          formData.email || undefined,
          formData.displayName || undefined
        );
      }

      if (!result.success) {
        // Error is handled by AuthContext
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: '' };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, text: 'Weak' };
    if (score <= 3) return { level: 2, text: 'Medium' };
    return { level: 3, text: 'Strong' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="login-page">
      <div className="login-container">
        <header className="login-header">
          <div className="login-logo">🏠</div>
          <h1>LaLa Home</h1>
          <p>Smart home automation</p>
        </header>

        <div className="login-card">
          <div className="login-tabs">
            <button
              className={`login-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              className={`login-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Register
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
              />
              {formErrors.username && (
                <span className="error-text">{formErrors.username}</span>
              )}
            </div>

            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label>Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                  {formErrors.email && (
                    <span className="error-text">{formErrors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Display Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    placeholder="How should we call you?"
                    autoComplete="name"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter your password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {formErrors.password && (
                <span className="error-text">{formErrors.password}</span>
              )}
              {mode === 'register' && formData.password && (
                <>
                  <div className="password-strength">
                    {[1, 2, 3].map(level => (
                      <div
                        key={level}
                        className={`strength-bar ${
                          passwordStrength.level >= level
                            ? passwordStrength.level === 1
                              ? 'weak'
                              : passwordStrength.level === 2
                              ? 'medium'
                              : 'strong'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                  <span className="strength-text">{passwordStrength.text}</span>
                </>
              )}
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                {formErrors.confirmPassword && (
                  <span className="error-text">{formErrors.confirmPassword}</span>
                )}
              </div>
            )}

            {error && (
              <div className="error-message">{error}</div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading && <span className="loading-spinner" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="login-footer">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <a onClick={() => switchMode('register')}>Register</a>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <a onClick={() => switchMode('login')}>Sign In</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
