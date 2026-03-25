'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      if (!data.session) {
        setSuccess(true);
      } else {
        router.push('/feed');
      }
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/feed` },
    });
  };

  if (success) {
    return (
      <div className="auth-page">
        <motion.div
          className="auth-card max-w-sm w-full text-center space-y-6"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="text-white/40 text-sm leading-relaxed">
            We&apos;ve sent a verification link to <span className="text-white font-medium">{email}</span>.
            Please confirm to activate your account.
          </p>
          <Link href="/login" className="inline-block text-white/60 hover:text-white text-sm transition-colors">
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Ambient glow */}
      <div
        className="auth-glow-orb"
        style={{ width: 250, height: 250, background: 'rgba(255,255,255,0.03)', top: '10%', right: '-8%' }}
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
          <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="text-white/35 text-sm">Join anonymously in seconds</p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-5">
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

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">or sign up with</div>

        {/* Social Buttons */}
        <div className="flex justify-center gap-4">
          <button onClick={handleGoogleSignUp} className="auth-social-btn" title="Sign up with Google">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </button>
          <button className="auth-social-btn" title="Sign up with Apple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-white/35 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:underline font-medium transition-colors">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
