'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { Heart, X, MessageCircle, Check } from 'lucide-react';
import { VerifiedBadge } from '@/components/PostCard';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface SwipeFeedProps {
  posts: any[];
  userId: string;
  onRefresh: () => void;
}

export function SwipeFeed({ posts, userId, onRefresh }: SwipeFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipe = async (direction: 'left' | 'right', postId: string) => {
    setExitDirection(direction);
    if (direction === 'right') {
      try {
        await supabase.from('likes').insert({ user_id: userId, post_id: postId });
      } catch (error) {
        // Ignore duplicate likes
      }
    }
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setExitDirection(null);
    }, 200);
  };

  const currentPost = posts[currentIndex];

  if (currentIndex >= posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-2">You&apos;re all caught up!</h2>
        <p className="text-sm">Check back later for more unfiltered thoughts.</p>
        <button
          onClick={() => {
            setCurrentIndex(0);
            onRefresh();
          }}
          className="mt-6 px-6 py-2 bg-white text-black font-bold rounded-full text-sm hover:bg-gray-200 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6">
      <div className="relative w-full max-w-sm h-[55vh] max-h-[480px]">
        <AnimatePresence mode="popLayout">
          {posts.map((post, index) => {
            if (index < currentIndex) return null;
            if (index > currentIndex + 2) return null;

            const isTop = index === currentIndex;

            return (
              <SwipeCard
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

      {currentPost && (
        <div className="flex justify-center gap-8 mt-6 z-10">
          <button
            onClick={() => handleSwipe('left', currentPost.id)}
            className="w-16 h-16 rounded-full bg-gray-900 border-2 border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-900/20 hover:border-red-500/40 transition-all active:scale-90"
          >
            <X size={30} strokeWidth={3} />
          </button>
          <button
            onClick={() => handleSwipe('right', currentPost.id)}
            className="w-16 h-16 rounded-full bg-gray-900 border-2 border-green-500/20 flex items-center justify-center text-green-500 hover:bg-green-900/20 hover:border-green-500/40 transition-all active:scale-90"
          >
            <Heart size={28} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
}

function SwipeCard({ post, isTop, index, onSwipe }: { post: any; isTop: boolean; index: number; onSwipe: (dir: 'left' | 'right') => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const likeOpacity = useTransform(x, [0, 80, 150], [0, 0.5, 1]);
  const nopeOpacity = useTransform(x, [0, -80, -150], [0, 0.5, 1]);
  const likeScale = useTransform(x, [0, 80, 150], [0.5, 0.8, 1]);
  const nopeScale = useTransform(x, [0, -80, -150], [0.5, 0.8, 1]);
  const bgLike = useTransform(x, [0, 150], ['rgba(34,197,94,0)', 'rgba(34,197,94,0.08)']);
  const bgNope = useTransform(x, [0, -150], ['rgba(239,68,68,0)', 'rgba(239,68,68,0.08)']);

  const handleDragEnd = (_e: any, info: any) => {
    const threshold = 80;
    const velocity = Math.abs(info.velocity.x);
    
    if (info.offset.x > threshold || (info.offset.x > 40 && velocity > 500)) {
      onSwipe('right');
    } else if (info.offset.x < -threshold || (info.offset.x < -40 && velocity > 500)) {
      onSwipe('left');
    }
  };

  const authorName = post.is_anonymous ? 'Anonymous' : (post.profiles?.display_name || post.profiles?.alias || 'Unknown');
  const isVerified = !post.is_anonymous && post.profiles?.role === 'admin';

  return (
    <motion.div
      className="absolute inset-0 w-full h-full rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden touch-none select-none"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - index,
        scale: 1 - index * 0.05,
        y: index * 12,
        background: isTop ? useTransform(
          x,
          [-150, 0, 150],
          ['rgba(17,17,17,1)', 'rgba(17,17,17,1)', 'rgba(17,17,17,1)']
        ) : 'rgb(17,17,17)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1 - index * 0.05, opacity: 1 }}
      exit={{
        x: x.get() > 0 ? 400 : -400,
        opacity: 0,
        rotate: x.get() > 0 ? 30 : -30,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
    >
      {/* Green overlay (swipe right) */}
      {isTop && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none z-10"
          style={{ background: bgLike }}
        />
      )}

      {/* Red overlay (swipe left) */}
      {isTop && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none z-10"
          style={{ background: bgNope }}
        />
      )}

      {/* ✓ LIKE stamp */}
      {isTop && (
        <motion.div
          className="absolute top-6 right-6 z-20 pointer-events-none flex items-center gap-2"
          style={{ opacity: likeOpacity, scale: likeScale }}
        >
          <div className="w-14 h-14 rounded-full border-[3px] border-green-400 flex items-center justify-center bg-green-400/10">
            <Check size={32} className="text-green-400" strokeWidth={3} />
          </div>
        </motion.div>
      )}

      {/* ✗ NOPE stamp */}
      {isTop && (
        <motion.div
          className="absolute top-6 left-6 z-20 pointer-events-none flex items-center gap-2"
          style={{ opacity: nopeOpacity, scale: nopeScale }}
        >
          <div className="w-14 h-14 rounded-full border-[3px] border-red-400 flex items-center justify-center bg-red-400/10">
            <X size={32} className="text-red-400" strokeWidth={3} />
          </div>
        </motion.div>
      )}

      {/* Card content */}
      <div className="relative z-0 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-1.5 font-bold text-gray-300">
            {authorName}
            {isVerified && <VerifiedBadge size={15} />}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <p className="text-xl font-medium text-center leading-relaxed">
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
      </div>
    </motion.div>
  );
}
