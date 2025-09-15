'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signInWithEmail } from '@/lib/authService';
import './login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { success, error: errorMsg } = await signInWithEmail(email, password);

      if (success) {
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(errorMsg || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
