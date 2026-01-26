'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Dashboard } from './Dashboard';
import { signInWithEmail } from '@/lib/authService';
import { Button } from '@/components/ui/button';
import './login/login.css';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      const { success, error: errorMsg } = await signInWithEmail(email, password);

      if (success) {
        // User state will be updated by AuthContext, which will re-render this component
        // and show the Dashboard instead of the login form
      } else {
        setError(errorMsg || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    // If user is authenticated, we can stay on this page and show dashboard
    // If not authenticated, we show the login form
  }, [user, router]);

  if (loading) {
    return (
      <div className="login-container" role="status" aria-label="Authenticating">
        <div className="logo-container">
          <Image
            src="/icons/icon.jpg"
            alt="Capybara Logo"
            width={120}
            height={120}
            className="login-logo"
          />
        </div>
      </div>
    );
  }

  // If user is authenticated, show the dashboard
  if (user) {
    return <Dashboard />;
  }

  // If not authenticated, show the login form
  return (
    <div className="login-container">
      <div className="logo-container">
        <Image
          src="/icons/icon.jpg"
          alt="Capybara Logo"
          width={120}
          height={120}
          className="login-logo"
        />
      </div>
      <h1 className="app-title">Capybara&apos;s Dashboard</h1>
      {error && <div className="error-message">{error}</div>}
      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Magic id..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
          required
        />
        <input
          type="password"
          placeholder="Magic word..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          required
        />
        <Button type="submit" variant="info" className="login-btn" disabled={loginLoading}>
          {loginLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
}


