'use client';

import React, {
  useState,
} from 'react';

import {
  ShieldAlert,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

import { API_URL } from '@/lib/api';


interface LoginViewProps {
  onLoginSuccess: (
    user: {
      username: string;
      role: string;
      token: string;
      account_status: string;
    }
  ) => void;

  onSwitchToSignup: () => void;
}


export const LoginView: React.FC<
  LoginViewProps
> = ({
  onLoginSuccess,
  onSwitchToSignup,
}) => {

  const [
    username,
    setUsername,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();


    if (!username || !password) {

      setError(
        'Enter your username and password.'
      );

      return;
    }


    setLoading(true);
    setError(null);


    try {

      const formData =
        new URLSearchParams({
          username,
          password,
        });


      const res = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded',
          },

          body: formData.toString(),
        }
      );


      const data =
        await res
          .json()
          .catch(
            () => ({})
          );


      if (!res.ok) {

        const messages:
          Record<string, string> = {

          ACCOUNT_PENDING_APPROVAL:
            'Your account is waiting for administrator approval.',

          ACCOUNT_REJECTED:
            'This account request was rejected.',

          ACCOUNT_SUSPENDED:
            'This account is currently suspended.',
        };


        setError(
          messages[data.detail]
          ||
          data.detail
          ||
          'Unable to sign in.'
        );


        return;
      }


      localStorage.setItem(
        'vigil_token',
        data.access_token
      );


      localStorage.setItem(
        'vigil_user',
        JSON.stringify({
          username:
            data.username,

          role:
            data.role,

          account_status:
            data.account_status,
        })
      );


      onLoginSuccess({
        username:
          data.username,

        role:
          data.role,

        token:
          data.access_token,

        account_status:
          data.account_status,
      });

    } catch {

      setError(
        'VIGIL could not reach the security service. Check the backend URL.'
      );

    } finally {

      setLoading(false);
    }
  };


  return (

    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">

      <div className="w-full max-w-md bg-[#101722] border border-[#26334D] rounded-2xl p-8 shadow-2xl">

        <div className="mb-7">

          <div className="inline-flex w-11 h-11 rounded-xl bg-cyan-400/10 border border-cyan-400/20 items-center justify-center mb-4">

            <ShieldAlert className="w-6 h-6 text-cyan-300" />

          </div>


          <h1 className="text-2xl font-semibold text-white tracking-tight">

            Sign in to VIGIL

          </h1>


          <p className="mt-2 text-sm text-slate-400">

            Voice security workspace for authorized users.

          </p>

        </div>


        {error && (

          <div className="mb-5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-300 text-sm flex gap-2">

            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />

            <span>
              {error}
            </span>

          </div>

        )}


        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <label className="block text-sm text-slate-300">

            Username

            <div className="relative mt-2">

              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />

              <input
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                autoComplete="username"
                className="w-full bg-[#151E2B] border border-[#26334D] rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/60"
                placeholder="your username"
              />

            </div>

          </label>


          <label className="block text-sm text-slate-300">

            Password

            <div className="relative mt-2">

              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                autoComplete="current-password"
                className="w-full bg-[#151E2B] border border-[#26334D] rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/60"
                placeholder="your password"
              />

            </div>

          </label>


          <button
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#071016] font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >

            {loading
              ? 'Signing in…'
              : 'Sign in'
            }

            {!loading && (
              <ArrowRight className="w-4 h-4" />
            )}

          </button>

        </form>


        <div className="mt-7 pt-5 border-t border-[#26334D] text-sm text-slate-500 text-center">

          Need access?

          {' '}

          <button
            onClick={
              onSwitchToSignup
            }
            className="text-cyan-300 hover:text-cyan-200"
          >

            Request an account

          </button>

        </div>

      </div>

    </div>
  );
};
