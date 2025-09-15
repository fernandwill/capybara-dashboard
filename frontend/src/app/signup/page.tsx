'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '@/lib/authService';
import '../login/login.css';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const { success, error: errorMsg } = await signUpWithEmail(email, password, name);

      if (success) {
        setSuccess(true);
        // Optionally redirect to login page after successful signup
        // router.push('/login');
      } else {
        setError(errorMsg || 'Sign up failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Sign up error:', err);
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
      <h1 className="app-title">Create Account</h1>
      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">
          Account created successfully! Please check your email for confirmation.
        </div>
      )}
      <form className="login-form" onSubmit={handleSignUp}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-input"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          required
        />
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <div className="login-footer">
        <p>
          Already have an account?{' '}
          <button 
            onClick={() => router.push('/login')}
            className="login-link"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}