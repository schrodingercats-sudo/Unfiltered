'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/feed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tighter uppercase">Welcome Back</h1>
          <p className="mt-2 text-gray-400">Log in to your anonymous identity</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-md text-sm">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none transition-all"
                placeholder="you@college.edu"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Don&apos;t have an identity yet?{' '}
            <Link href="/signup" className="text-white hover:underline font-medium">
              Join Anonymously
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
