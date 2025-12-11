import { useState, useCallback, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import './TwoFactorAuth.css';

export default function TwoFactorAuth() {
  const navigate = useNavigate();
  const { verify2FA, signInState, twoFactorToken } = useAuthContext();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not in 2FA state or if already authorized
  useEffect(() => {
    if (signInState === 'authorized') {
      navigate('/home', { replace: true });
    } else if (signInState === 'unauthorized') {
      navigate('/signin', { replace: true });
    }
  }, [signInState, navigate]);

  // Redirect if no 2FA token
  useEffect(() => {
    if (!twoFactorToken) {
      navigate('/signin', { replace: true });
    }
  }, [twoFactorToken, navigate]);

  const handleCodeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số');
      return;
    }

    setIsLoading(true);
    try {
      const success = await verify2FA(code);
      if (success) {
        navigate('/home', { replace: true });
      } else {
        setError('Mã 2FA không chính xác. Vui lòng thử lại.');
        setCode('');
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigate('/signin', { replace: true });
  };

  return (
    <div className="twofa-container">
      <div className="twofa-card">
        <button className="close-button" onClick={handleBackToSignIn}>
          ✕
        </button>

        <div className="twofa-header">
          <div className="twofa-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="twofa-title">Xác thực 2 lớp</h1>
          <p className="twofa-subtitle">
            Nhập mã xác thực được gửi đến email của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="twofa-form">
          <div className="code-input-wrapper">
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
              maxLength={6}
              className={`code-input ${error ? 'error' : ''}`}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <p className="code-hint">
            Nhập 6 chữ số từ email xác thực của bạn
          </p>

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? 'Đang xác thực...' : 'Xác thực'}
          </button>

          <button
            type="button"
            className="back-button"
            onClick={handleBackToSignIn}
            disabled={isLoading}
          >
            Quay lại đăng nhập
          </button>
        </form>

        <div className="twofa-footer">
          <p className="footer-text">
            Không nhận được mã? Kiểm tra thư mục spam hoặc đăng nhập lại.
          </p>
        </div>
      </div>
    </div>
  );
}
