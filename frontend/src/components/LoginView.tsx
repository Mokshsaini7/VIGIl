'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: {
    username: string;
    role: string;
    token: string;
  }) => void;
  onSwitchToSignup: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onSwitchToSignup,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch(
        'https://vigil-backend-bbwj.onrender.com/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        }
      );

      if (res.ok) {
        const data = await res.json();

        localStorage.setItem('vigil_token', data.access_token);

        localStorage.setItem(
          'vigil_user',
          JSON.stringify({
            username: data.username,
            role: data.role,
          })
        );

        onLoginSuccess({
          username: data.username,
          role: data.role,
          token: data.access_token,
        });
      } else {
        const errData = await res
          .json()
          .catch(() => ({ detail: 'Authentication failed' }));

        setError(
          errData.detail || 'Invalid username or password.'
        );
      }
    } catch (err) {
      setError(
        'Server connection error. Please ensure backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121824] border border-[#26334D] rounded-2xl p-8 shadow-2xl space-y-6">

        {/* VIGIL Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 items-center justify-center text-blue-400 mb-2 glow-blue">
            <ShieldAlert className="w-8 h-8 text-blue-400" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-wide">
            VIGIL
          </h1>

          <p className="text-xs text-blue-400 uppercase tracking-widest font-mono">
            Voice Security Operations Center
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">

          {/* Username */}
          <div>
            <label className="block text-gray-400 mb-1.5 font-medium">
              Username
            </label>

            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />

              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#192233] border border-[#26334D] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-400 mb-1.5 font-medium">
              Password
            </label>

            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#192233] border border-[#26334D] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
          >
            <span>
              {loading ? 'Authenticating...' : 'Sign In to VIGIL'}
            </span>

            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer Link to Signup */}
        <div className="pt-4 border-t border-[#26334D] text-center text-xs text-gray-400">
          Don't have an account?{' '}

          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-blue-400 font-semibold hover:underline"
          >
            Create VIGIL Account
          </button>
        </div>

        {/* Team Credit */}
        <div className="text-center text-xs text-gray-500 -mt-2">
          Developed by{' '}

          <span className="text-gray-300 font-medium">
            Team DataMinds
          </span>{' '}

          with love{' '}
          <span className="text-red-500 text-sm">♥</span>
        </div>

      </div>
    </div>
  );
};

export default LoginView;
