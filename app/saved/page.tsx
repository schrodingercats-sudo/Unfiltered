'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { BottomNav } from '@/components/BottomNav';
import { PostCard } from '@/components/PostCard';
import { useRouter } from 'next/navigation';

export default function Saved() {
  const { user, profile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSavedPosts = async () => {
    setLoading(true);
    try {
      const { data: savedData, error: savedError } = await supabase
        .from('saves')
        .select('post_id')
        .eq('user_id', user!.id);
      
      if (savedError) throw savedError;

      if (savedData && savedData.length > 0) {
        const postIds = savedData.map(s => s.post_id);
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (alias, display_name, avatar_url)
          `)
          .in('id', postIds)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;
        setPosts(postsData || []);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchSavedPosts();
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

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
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <h1 className="text-xl font-black tracking-tighter uppercase">Saved Posts</h1>
      </header>

      <main className="max-w-md mx-auto">
        {loading ? (
          <div className="flex justify-center p-8 text-gray-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="flex justify-center p-8 text-gray-500">No saved posts yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
