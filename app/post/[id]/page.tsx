'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PostCard } from '@/components/PostCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function SinglePostPage() {
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (alias)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  if (profile?.is_banned) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-4xl font-black text-red-500 uppercase">Account Banned</h1>
          <p className="text-gray-400">Your account has been permanently banned for violating our community guidelines regarding severe profanity.</p>
          <button 
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
            className="mt-8 px-6 py-2 bg-white text-black font-bold rounded-full"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex items-center gap-4">
        <Link href="/feed" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-black tracking-tighter uppercase">UNFILTERED</h1>
      </header>

      <main className="max-w-md mx-auto pt-4">
        {loading ? (
          <div className="flex justify-center p-8 text-gray-500">Loading...</div>
        ) : !post ? (
          <div className="flex justify-center p-8 text-gray-500">Post not found.</div>
        ) : (
          <div className="border border-gray-800 rounded-xl overflow-hidden mx-4">
            <PostCard post={post} />
          </div>
        )}

        <div className="mt-8 text-center px-4">
          <p className="text-gray-500 mb-4">Want to join the conversation?</p>
          <Link 
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
          >
            Join Anonymously
          </Link>
        </div>
      </main>
    </div>
  );
}
