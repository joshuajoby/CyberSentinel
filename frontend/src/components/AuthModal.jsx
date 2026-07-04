import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { Shield, X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { login, register, setToken, setUser } = useAuth();
  
  // Tab: 'login' | 'register' | 'forgot'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  // Role: 'user' | 'admin'
  const [role, setRole] = useState('user');
  
  // Form controls
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Password Recovery OTP flow
  const [forgotStep, setForgotStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devOtp, setDevOtp] = useState('');

  // Public configurations from backend
  const [gmailClientId, setGmailClientId] = useState('');

  // Fetch public credentials on mount
  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:8000/api/config/public/')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setGmailClientId(data.gmail_client_id || '');
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Handle JWT token callback from real Google Sign-In
  const handleGoogleCredentialResponse = useCallback(async (response) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/google-login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google login failed');
      
      localStorage.setItem('cs_token', data.token);
      setToken(data.token);
      setUser(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onClose, setToken, setUser]);

  // Load and mount the real Google Sign-In SDK button
  useEffect(() => {
    /* global google */
    if (isOpen && activeTab !== 'forgot' && typeof google !== 'undefined') {
      const activeClientId = gmailClientId && !gmailClientId.includes('YOUR_GOOGLE_CLIENT_ID')
        ? gmailClientId
        : '965152865955-h6dpsf7v1f2d65jebvcrv0m8bkr9i4f2.apps.googleusercontent.com'; // Default client ID for fallback

      try {
        google.accounts.id.initialize({
          client_id: activeClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        google.accounts.id.renderButton(
          document.getElementById("google-signin-btn-container"),
          { 
            theme: "outline", 
            size: "large", 
            width: 368, 
            shape: "pill",
            text: "signin_with",
            logo_alignment: "left"
          }
        );
      } catch (err) {
        console.warn("Failed to render GIS button:", err);
      }
    }
  }, [isOpen, activeTab, gmailClientId, handleGoogleCredentialResponse]);

  // Mock Developer Sandbox Google login helper
  const handleMockGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const mockToken = 'mock_google_token_' + Math.random().toString(36).substring(7);
      const mockUser = {
        username: 'sandbox_google_user',
        email: 'sandbox_user@gmail.com',
        is_admin: false
      };
      
      localStorage.setItem('cs_token', mockToken);
      setToken(mockToken);
      setUser(mockUser);
      setLoading(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, role === 'admin');
      onClose();
    } catch (err) {
      setError(err.message || 'Login credentials invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password, confirmPassword, role);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch reset code.');
      
      setDevOtp(data.otp);
      setForgotStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset verification failed.');
      
      setSuccess('Password updated successfully! Please sign in.');
      setActiveTab('login');
      setForgotStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      
      {/* iOS styled glass card */}
      <div className="ios-glass" style={{
        width: 420,
        padding: '36px 28px',
        position: 'relative',
        animation: 'revealUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', right: 20, top: 20,
            background: 'rgba(255,255,255,0.04)', border: 'none',
            borderRadius: '50%', width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', cursor: 'pointer'
          }}
        >
          <X size={13} />
        </button>

        {/* Brand details */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 8, textAlign: 'center' }}>
          <div style={{
            background: 'var(--accent-orange-glow)', color: 'var(--accent-orange)',
            width: 48, height: 48, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 4
          }}>
            <Shield size={24} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Welcome to CyberSentinel
          </h3>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Sign in to access your secure dashboard
          </span>
        </div>

        {/* User/Admin Role Tab Selector */}
        {activeTab !== 'forgot' && (
          <div style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: 4,
            marginBottom: 4
          }}>
            <button
              type="button"
              onClick={() => { setRole('user'); setError(''); }}
              style={{
                flex: 1, padding: '8px',
                background: role === 'user' ? 'var(--bg-glass)' : 'transparent',
                border: 'none', borderRadius: 6,
                boxShadow: role === 'user' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                color: role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.25s'
              }}
            >
              User Login
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setError(''); }}
              style={{
                flex: 1, padding: '8px',
                background: role === 'admin' ? 'var(--bg-glass)' : 'transparent',
                border: 'none', borderRadius: 6,
                boxShadow: role === 'admin' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                color: role === 'admin' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.25s'
              }}
            >
              Administrator
            </button>
          </div>
        )}

        {/* Success / Error alerts */}
        {error && (
          <div className="slide-up-item" style={{
            padding: '8px 12px', background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)',
            borderRadius: 8, color: '#FF3B30', fontSize: 11.5
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="slide-up-item" style={{
            padding: '8px 12px', background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.2)',
            borderRadius: 8, color: '#34C759', fontSize: 11.5
          }}>
            ✓ {success}
          </div>
        )}

        {/* ── Tab: Login Form ────────────────────────────────────────────────── */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="form-label">EMAIL ADDRESS</label>
              <input
                type="email"
                className="ios-input"
                placeholder="e.g. user@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">PASSWORD</label>
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-orange)', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                className="ios-input"
                placeholder="password credentials"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="ios-btn ios-btn-primary" style={{ width: '100%', marginTop: 6 }}>
              {loading ? 'Connecting...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Tab: Register Form ─────────────────────────────────────────────── */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="form-label">USERNAME</label>
              <input
                type="text"
                className="ios-input"
                placeholder="choose username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="form-label">EMAIL ADDRESS</label>
              <input
                type="email"
                className="ios-input"
                placeholder="e.g. user@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="form-label">PASSWORD</label>
              <input
                type="password"
                className="ios-input"
                placeholder="create password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="form-label">CONFIRM PASSWORD</label>
              <input
                type="password"
                className="ios-input"
                placeholder="re-enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="ios-btn ios-btn-primary" style={{ width: '100%', marginTop: 6 }}>
              {loading ? 'Registering...' : 'Sign Up'}
            </button>
          </form>
        )}

        {/* ── Tab: Forgot Password Form ──────────────────────────────────────── */}
        {activeTab === 'forgot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {forgotStep === 1 ? (
              <form onSubmit={handleInitiateForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="form-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    className="ios-input"
                    placeholder="enter registered email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="ios-btn ios-btn-primary" style={{ width: '100%' }}>
                  {loading ? 'Sending...' : 'Reset Password'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCompleteForgot} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {devOtp && (
                  <div style={{ padding: 10, background: 'var(--accent-orange-glow)', borderRadius: 8, fontSize: 11, color: 'var(--accent-orange)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>SANDBOX RESET CODE:</span>
                    <strong style={{ fontSize: 12, fontFamily: 'monospace' }}>{devOtp}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="form-label">6-DIGIT OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="ios-input"
                    placeholder="enter code"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="form-label">NEW PASSWORD</label>
                  <input
                    type="password"
                    className="ios-input"
                    placeholder="enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="ios-btn ios-btn-primary" style={{ width: '100%', marginTop: 6 }}>
                  {loading ? 'Applying...' : 'Update Password'}
                </button>
              </form>
            )}
            <button
              onClick={() => { setActiveTab('login'); setForgotStep(1); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Back to Login
            </button>
          </div>
        )}

        {/* ── Social Google Authentication ───────────────────────────────────── */}
        {activeTab !== 'forgot' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>

            {/* Real Google Sign In container */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div id="google-signin-btn-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
              
              {/* Optional Sandbox Fallback */}
                <button
                  type="button"
                  onClick={handleMockGoogleLogin}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', fontSize: 11, fontWeight: 500,
                    textDecoration: 'underline'
                  }}
                >
                  Bypass via Sandbox
                </button>
            </div>
          </>
        )}

        {/* Modal switching footer */}
        {activeTab !== 'forgot' && (
          <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 4 }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {activeTab === 'login' ? "Don't have an account?" : "Already registered?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab(activeTab === 'login' ? 'register' : 'login');
                  setError('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-orange)', fontWeight: 800, cursor: 'pointer' }}
              >
                {activeTab === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
