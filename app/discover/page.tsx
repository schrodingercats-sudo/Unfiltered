'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { BottomNav } from '@/components/BottomNav';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { Heart, X, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function Discover() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (alias)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);
      
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
      fetchPosts();
    }
  }, [user]);

  const handleSwipe = async (direction: 'left' | 'right', postId: string) => {
    if (direction === 'right') {
      // Like the post
      try {
        await supabase.from('likes').insert({ user_id: user!.id, post_id: postId });
      } catch (error) {
        // Ignore duplicate likes
      }
    }
    setCurrentIndex((prev) => prev + 1);
  };

  if (!user) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  if (profile?.is_banned) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-4xl font-black text-red-500 uppercase">Account Banned</h1>
          <p className="text-gray-400">Your account has been permanently banned.</p>
        </div>
      </div>
    );
  }

  const currentPost = posts[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white pb-20 overflow-hidden flex flex-col">
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <h1 className="text-xl font-black tracking-tighter uppercase text-center">Discover</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative p-4 max-w-md mx-auto w-full h-full">
        {loading ? (
          <div className="text-gray-500">Loading new posts...</div>
        ) : currentIndex >= posts.length ? (
          <div className="text-center text-gray-500">
            <h2 className="text-2xl font-bold mb-2">You're all caught up!</h2>
            <p>Check back later for more unfiltered thoughts.</p>
            <button 
              onClick={() => {
                setCurrentIndex(0);
                fetchPosts();
              }}
              className="mt-6 px-6 py-2 bg-white text-black font-bold rounded-full"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="relative w-full h-[60vh] max-h-[500px]">
            <AnimatePresence>
              {posts.map((post, index) => {
                if (index < currentIndex) return null;
                if (index > currentIndex + 2) return null; // Only render top 3 cards for performance
                
                const isTop = index === currentIndex;
                
                return (
                  <SwipeableCard 
                    key={post.id} 
                    post={post} 
                    isTop={isTop} 
                    index={index - currentIndex}
                    onSwipe={(dir) => handleSwipe(dir, post.id)} 
                  />
                );
              }).reverse()}
            </AnimatePresence>
          </div>
        )}
        
        {!loading && currentIndex < posts.length && (
          <div className="flex justify-center gap-8 mt-8 z-10">
            <button 
              onClick={() => handleSwipe('left', currentPost.id)}
              className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-red-500 hover:bg-red-900/20 transition-colors"
            >
              <X size={32} />
            </button>
            <button 
              onClick={() => handleSwipe('right', currentPost.id)}
              className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-green-500 hover:bg-green-900/20 transition-colors"
            >
              <Heart size={32} />
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function SwipeableCard({ post, isTop, index, onSwipe }: { post: any, isTop: boolean, index: number, onSwipe: (dir: 'left'|'right') => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      className="absolute inset-0 w-full h-full bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col shadow-2xl"
      style={{ 
        x: isTop ? x : 0, 
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 1,
        zIndex: 10 - index,
        scale: 1 - index * 0.05,
        y: index * 20
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { cursor: 'grabbing' } : {}}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1 - index * 0.05, opacity: 1 }}
      exit={{ x: x.get() > 0 ? 300 : -300, opacity: 0, transition: { duration: 0.2 } }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="font-bold text-gray-300">
          {post.is_anonymous ? 'Anonymous' : post.profiles?.alias || 'Unknown'}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(post.created_at).toLocaleDateString()}
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <p className="text-2xl font-medium text-center leading-relaxed">
          {post.content}
        </p>
      </div>
      
      <div className="mt-6 flex justify-center">
        <Link 
          href={`/post/${post.id}`}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle size={20} />
          <span>View Comments</span>
        </Link>
      </div>
      
      {/* Swipe Indicators */}
      <motion.div 
        className="absolute top-8 right-8 border-4 border-green-500 text-green-500 font-black text-2xl uppercase px-4 py-1 rounded-lg rotate-12"
        style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
      >
        LIKE
      </motion.div>
      <motion.div 
        className="absolute top-8 left-8 border-4 border-red-500 text-red-500 font-black text-2xl uppercase px-4 py-1 rounded-lg -rotate-12"
        style={{ opacity: useTransform(x, [0, -100], [0, 1]) }}
      >
        NOPE
      </motion.div>
    </motion.div>
  );
}
