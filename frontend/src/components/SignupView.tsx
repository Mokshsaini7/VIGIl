'use client';

import React, {
  useState,
} from 'react';

import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

import { API_URL } from '@/lib/api';


interface SignupViewProps {

  onSignupSuccess: (
    user: {
      username: string;
      role: string;
      token: string;
      account_status: string;
    }
  ) => void;

  onSwitchToLogin: () => void;
}


export const SignupView: React.FC<
  SignupViewProps
> = ({
  onSignupSuccess,
  onSwitchToLogin,
}) => {

  const [
    username,
    setUsername,
  ] = useState('');

  const [
    email,
    setEmail,
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

    setError(null);


    if (
      !username ||
      !email ||
      !password
    ) {

      setError(
        'Complete all fields.'
      );

      return;
    }


    if (password.length < 10) {

      setError(
        'Use at least 10 characters for your password.'
      );

      return;
    }


    setLoading(true);


    try {

      const res = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            username,
            email,
            password,
          }),
        }
      );


      const data =
        await res
          .json()
          .catch(
            () => ({})
          );


      if (!res.ok) {

        setError(
          data.detail
          ||
          'Could not create the account.'
        );

        return;
      }


      onSignupSuccess({
        username:
          data.username,

        role:
          'USER',

        token:
          '',

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

            <ShieldCheck className="w-6 h-6 text-cyan-300" />

          </div>


          <h1 className="text-2xl font-semibold text-white tracking-tight">

            Request VIGIL access

          </h1>


          <p className="mt-2 text-sm text-slate-400">

            Create an account. An administrator will review it before access is granted.

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
                className="w-full bg-[#151E2B] border border-[#26334D] rounded-xl pl-9 pr-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/60"
              />

            </div>

          </label>


          <label className="block text-sm text-slate-300">

            Email

            <div className="relative mt-2">

              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                autoComplete="email"
                className="w-full bg-[#151E2B] border border-[#26334D] rounded-xl pl-9 pr-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/60"
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
                autoComplete="new-password"
                className="w-full bg-[#151E2B] border border-[#26334D] rounded-xl pl-9 pr-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/60"
              />

            </div>

          </label>


          <div className="rounded-xl border border-[#26334D] bg-[#151E2B]/70 px-4 py-3 text-xs text-slate-400">

            New accounts start as{' '}

            <span className="text-amber-300">
              Pending
            </span>

            .

            {' '}

            Public signup cannot select an administrative role.

          </div>


          <button
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#071016] font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >

            {loading
              ? 'Submitting request…'
              : 'Request access'
            }

            {!loading && (
              <ArrowRight className="w-4 h-4" />
            )}

          </button>

        </form>


        <div className="mt-7 pt-5 border-t border-[#26334D] text-sm text-slate-500 text-center">

          Already approved?

          {' '}

          <button
            onClick={
              onSwitchToLogin
            }
            className="text-cyan-300 hover:text-cyan-200"
          >

            Sign in

          </button>

        </div>

      </div>

    </div>
  );
};
