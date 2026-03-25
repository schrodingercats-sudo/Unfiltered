'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset link has been sent to your email.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card max-w-sm w-full space-y-7 relative z-10"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
            <p className="text-white/35 text-sm">Enter your email to receive a reset link</p>
          </div>
        </div>

        <form onSubmit={handleResetRequest} className="space-y-5">
          {error && (
            <motion.div
              className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-sm"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
            >
              {error}
            </motion.div>
          )}
          {message && (
            <motion.div
              className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
            >
              {message}
            </motion.div>
          )}

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="Email address"
          />

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
