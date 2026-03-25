'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'motion/react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/feed');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="auth-page">
      {/* Ambient glow orbs */}
      <div
        className="auth-glow-orb"
        style={{ width: 300, height: 300, background: 'rgba(255,255,255,0.03)', top: '-10%', left: '-5%' }}
      />
      <div
        className="auth-glow-orb"
        style={{ width: 200, height: 200, background: 'rgba(255,255,255,0.02)', bottom: '5%', right: '-3%', animationDelay: '4s' }}
      />

      <motion.div
        className="max-w-sm w-full flex flex-col items-center gap-10 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Brand logo placeholder */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
          <div className="absolute -inset-3 rounded-full bg-white/[0.02] blur-xl" />
        </motion.div>

        {/* Heading */}
        <motion.div
          className="text-center space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-5xl font-extrabold tracking-tight">
            Welcome Back
          </h1>
          <p className="text-white/40 text-sm font-light">
            Your anonymous identity awaits
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="w-full space-y-3"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/signup">
            <button className="auth-btn-primary">Sign Up</button>
          </Link>
          <Link href="/login">
            <button className="auth-btn-secondary">Log In</button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
