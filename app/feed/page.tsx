'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { BottomNav } from '@/components/BottomNav';
import { WritePostModal } from '@/components/WritePostModal';
import { PostCard } from '@/components/PostCard';
import { SwipeFeed } from '@/components/SwipeFeed';
import { PenSquare, LayoutList, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Feed() {
  const { user, profile, needsOnboarding } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'latest' | 'trending' | 'my_posts'>('latest');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'scroll' | 'swipe'>('scroll');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (alias, display_name, avatar_url, role)
        `)
        .eq('status', 'active');

      if (activeTab === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (activeTab === 'trending') {
        query = query.order('like_count', { ascending: false });
      } else if (activeTab === 'my_posts' && user) {
        query = query.eq('user_id', user.id).order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab, user]);

  useEffect(() => {
    if (needsOnboarding) {
      router.push('/onboarding');
    }
  }, [needsOnboarding, router]);

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
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter uppercase">UNFILTERED</h1>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'scroll' ? 'swipe' : 'scroll')}
            className={`p-2 rounded-full transition-colors ${
              viewMode === 'swipe'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={viewMode === 'scroll' ? 'Switch to Swipe mode' : 'Switch to Scroll mode'}
          >
            {viewMode === 'scroll' ? <Layers size={18} /> : <LayoutList size={18} />}
          </button>
          <button 
            onClick={() => setIsWriteModalOpen(true)}
            className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <PenSquare size={16} />
            Write
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['latest', 'trending', 'my_posts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${
              activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.replace('_', ' ')}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <main className="max-w-md mx-auto">
        {loading ? (
          <div className="flex justify-center p-8 text-gray-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="flex justify-center p-8 text-gray-500">No posts found.</div>
        ) : viewMode === 'scroll' ? (
          <div className="divide-y divide-gray-800">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onPostUpdated={fetchPosts} onPostDeleted={fetchPosts} />
            ))}
          </div>
        ) : (
          <SwipeFeed posts={posts} userId={user?.id || ''} onRefresh={fetchPosts} />
        )}
      </main>

      <WritePostModal 
        isOpen={isWriteModalOpen} 
        onClose={() => setIsWriteModalOpen(false)} 
        onPostCreated={fetchPosts} 
      />

      <BottomNav />
    </div>
  );
}
