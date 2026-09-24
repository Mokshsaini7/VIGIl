'use client';

import React from 'react';

import {
  Clock3,
  LogOut,
  ShieldCheck,
} from 'lucide-react';


interface PendingApprovalViewProps {

  username: string;

  onLogout: () => void;
}


export const PendingApprovalView: React.FC<
  PendingApprovalViewProps
> = ({
  username,
  onLogout,
}) => (

  <main className="min-h-screen bg-[#0B0F17] text-white flex items-center justify-center px-5 py-10">

    <section className="w-full max-w-lg border border-[#26334D] bg-[#101722] rounded-2xl p-8 shadow-2xl">

      <div className="flex items-start gap-4">

        <div className="h-11 w-11 rounded-xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center shrink-0">

          <Clock3 className="h-5 w-5 text-cyan-300" />

        </div>


        <div>

          <div className="flex items-center gap-2 text-sm text-cyan-300 font-medium">

            <ShieldCheck className="h-4 w-4" />

            VIGIL ACCESS REQUEST

          </div>


          <h1 className="mt-2 text-2xl font-semibold tracking-tight">

            Your account is under review

          </h1>


          <p className="mt-3 text-sm leading-6 text-slate-400">

            Thanks, {username}. A VIGIL administrator needs to approve your account before protected tools become available.

          </p>

        </div>

      </div>


      <div className="mt-7 rounded-xl border border-amber-400/15 bg-amber-400/5 p-4">

        <div className="text-xs uppercase tracking-wider text-amber-300/80">

          Current status

        </div>


        <div className="mt-1 text-sm text-slate-200">

          Pending administrator approval

        </div>

      </div>


      <button
        onClick={onLogout}
        className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >

        <LogOut className="h-4 w-4" />

        Sign out

      </button>

    </section>

  </main>
);
