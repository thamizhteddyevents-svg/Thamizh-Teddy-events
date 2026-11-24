

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('thamizhteddyevents@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        setErrorMessage('Invalid email or password.');
        return;
      }

      const { data: adminRecord, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (adminError || !adminRecord) {
        await supabase.auth.signOut();
        setErrorMessage('You are not authorized as an admin.');
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();

    } catch (error) {
      console.error('Admin login error:', error);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
  className="min-h-screen flex items-center justify-center px-4 py-12 bg-cover bg-center bg-fixed"
  style={{
    backgroundImage:
      "linear-gradient(rgba(0,0,0,0.78), rgba(0,0,0,0.88)), url('/poster.svg')",
  }}
>
      <div className="w-full max-w-md rounded-2xl border border-yellow-600/40 bg-zinc-950 p-8 shadow-2xl">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">
            THAMIZH TEDDY
          </h1>

          <p className="mt-2 text-sm tracking-[0.3em] text-yellow-200">
            EVENTS
          </p>

          <div className="mt-6">
            <h2 className="text-2xl font-semibold text-white">
              Admin Login
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Sign in to manage your event bookings
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm text-yellow-100">
              Admin Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
              placeholder="Enter admin email"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-yellow-100">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
              placeholder="Enter your password"
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-400">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-yellow-500 px-4 py-3 font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'PLEASE WAIT...' : 'LOGIN'}
          </button>

        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          Secure Admin Access · Thamizh Teddy Events
        </p>

        <div className="mt-5 text-center">
          <a href="/" className="text-sm text-yellow-400 hover:underline">
            ← Back to Website
          </a>
        </div>

      </div>
    </main>
  );
}
