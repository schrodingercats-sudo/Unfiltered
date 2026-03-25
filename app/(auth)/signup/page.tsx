'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [college, setCollege] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!college.trim()) {
      setError('Please enter your college or institute');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          college,
        },
      },
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
          <h1 className="text-4xl font-black tracking-tighter uppercase">Join Unfiltered</h1>
          <p className="mt-2 text-gray-400">Create your anonymous identity</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
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
                placeholder="you@paruluniversity.ac.in"
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">College / Institute</label>
              <input
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none transition-all text-white"
                placeholder="e.g. Parul University"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Identity...' : 'Join Anonymously'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Already have an identity?{' '}
            <Link href="/login" className="text-white hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
