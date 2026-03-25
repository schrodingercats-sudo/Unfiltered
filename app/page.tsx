'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/feed');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }

  if (user) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter uppercase">
            UNFILTERED
          </h1>
          <p className="text-xl text-gray-400">
            The anonymous Parul University comment board. Post your unfiltered thoughts.
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <Link 
            href="/signup"
            className="block w-full py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
          >
            Join Anonymously
          </Link>
          <Link 
            href="/login"
            className="block w-full py-4 bg-transparent border border-gray-600 text-white font-bold rounded-full hover:bg-gray-800 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
