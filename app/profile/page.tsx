'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { BottomNav } from '@/components/BottomNav';
import { PostCard } from '@/components/PostCard';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (alias)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyPosts();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user || !profile) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

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
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter uppercase">Profile</h1>
        <button 
          onClick={handleLogout}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </header>

      <main className="max-w-md mx-auto">
        <div className="p-6 border-b border-gray-800 text-center">
          <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black">
            {profile.alias.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold">{profile.alias}</h2>
          <p className="text-gray-400 mt-1">{profile.college}</p>
          <p className="text-xs text-gray-500 mt-2">
            Joined {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="py-4 px-4 border-b border-gray-800">
          <h3 className="font-bold uppercase tracking-wider text-sm text-gray-400">My Posts</h3>
        </div>

        {loading ? (
          <div className="flex justify-center p-8 text-gray-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="flex justify-center p-8 text-gray-500">You haven&apos;t posted anything yet.</div>
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
