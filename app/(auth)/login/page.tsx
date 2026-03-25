'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Your email is not confirmed yet. Please check your inbox for the verification link.');
      } else {
        setError(error.message);
      }
    } else {
      router.push('/feed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Ambient glow */}
      <div
        className="auth-glow-orb"
        style={{ width: 280, height: 280, background: 'rgba(255,255,255,0.025)', bottom: '5%', left: '-5%', animationDelay: '2s' }}
      />

      <motion.div
        className="auth-card max-w-sm w-full space-y-7 relative z-10"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Heading */}
        <motion.div
          className="text-center space-y-1"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Log In</h1>
          <p className="text-white/35 text-sm">Welcome back to your identity</p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <motion.div
              className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-sm"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-3">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="Email address"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input pr-12"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-white/40 hover:text-white/60 transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="auth-checkbox"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-white/40 hover:text-white transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-white/35 text-sm">
          New account?{' '}
          <Link href="/signup" className="text-white hover:underline font-medium transition-colors">
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
