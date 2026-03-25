'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Repeat2, Share, Bookmark, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { ShareModal } from '@/components/ShareModal';
import Image from 'next/image';
import Link from 'next/link';

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="inline-block flex-shrink-0"
      aria-label="Verified"
    >
      <path
        d="M9 12l2 2 4-4"
        stroke="#000"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 1l2.39 2.42L17.5 3l.42 3.13L21 8.5l-1.42 2.89L21 14.28l-3.08 2.37L17.5 19.78l-3.11.42L12 22.61l-2.39-2.41L6.5 19.78l-.42-3.13L3 14.28l1.42-2.89L3 8.5l3.08-2.37L6.5 3l3.11-.42L12 1z"
        fill="#FFD700"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface PostCardProps {
  post: any;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [repostCount, setRepostCount] = useState(post.repost_count);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const busyRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const checkInteractions = async () => {
      if (!user) return;
      const [{ data: likeData }, { data: saveData }, { data: repostData }] = await Promise.all([
        supabase.from('likes').select('id').eq('user_id', user.id).eq('post_id', post.id).maybeSingle(),
        supabase.from('saves').select('id').eq('user_id', user.id).eq('post_id', post.id).maybeSingle(),
        supabase.from('reposts').select('id').eq('user_id', user.id).eq('post_id', post.id).maybeSingle(),
      ]);
      if (likeData) setIsLiked(true);
      if (saveData) setIsSaved(true);
      if (repostData) setIsReposted(true);
    };

    checkInteractions();
  }, [user, post.id]);

  const guard = useCallback(async (key: string, fn: () => Promise<void>) => {
    if (busyRef.current[key]) return;
    busyRef.current[key] = true;
    try { await fn(); } finally { busyRef.current[key] = false; }
  }, []);

  const handleLike = () => guard('like', async () => {
    if (!user) return;
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev: number) => prev - 1);
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', post.id);
    } else {
      setIsLiked(true);
      setLikeCount((prev: number) => prev + 1);
      await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
    }
  });

  const handleSave = () => guard('save', async () => {
    if (!user) return;
    if (isSaved) {
      setIsSaved(false);
      await supabase.from('saves').delete().eq('user_id', user.id).eq('post_id', post.id);
    } else {
      setIsSaved(true);
      await supabase.from('saves').insert({ user_id: user.id, post_id: post.id });
    }
  });

  const handleRepost = () => guard('repost', async () => {
    if (!user) return;
    if (isReposted) {
      setIsReposted(false);
      setRepostCount((prev: number) => prev - 1);
      await supabase.from('reposts').delete().eq('user_id', user.id).eq('post_id', post.id);
    } else {
      setIsReposted(true);
      setRepostCount((prev: number) => prev + 1);
      await supabase.from('reposts').insert({ user_id: user.id, post_id: post.id });
    }
  });

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleReport = () => guard('report', async () => {
    if (!user) return;
    const reason = prompt('Reason for reporting (harassment, spam, hate_speech, self_harm, other):');
    if (reason && ['harassment', 'spam', 'hate_speech', 'self_harm', 'other'].includes(reason)) {
      await supabase.from('reports').insert({
        reporter_id: user.id,
        post_id: post.id,
        reason: reason
      });
      alert('Report submitted.');
    } else if (reason) {
      alert('Invalid reason.');
    }
  });

  const authorName = post.is_anonymous ? 'Anonymous' : (post.profiles?.display_name || post.profiles?.alias || 'Unknown');
  const authorAlias = post.is_anonymous ? null : post.profiles?.alias;
  const authorAvatar = post.is_anonymous ? null : post.profiles?.avatar_url;
  const isVerified = !post.is_anonymous && post.profiles?.role === 'admin';

  return (
    <>
      <article className="p-4 hover:bg-gray-900/50 transition-colors border-b border-gray-800 last:border-0">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {authorAvatar ? (
              <Link href={`/profile?id=${post.user_id}`} className="block w-10 h-10 rounded-full overflow-hidden relative">
                <Image 
                  src={authorAvatar} 
                  alt={authorName} 
                  fill 
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </Link>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <Link 
                    href={post.is_anonymous ? '#' : `/profile?id=${post.user_id}`}
                    className={`font-bold text-sm text-gray-200 hover:underline ${post.is_anonymous ? 'pointer-events-none' : ''}`}
                  >
                    {authorName}
                  </Link>
                  {isVerified && <VerifiedBadge size={16} />}
                  {authorAlias && (
                    <span className="text-xs text-gray-500 font-medium truncate max-w-[100px]">
                      @{authorAlias}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </div>
              </div>
              <button 
                onClick={handleReport}
                className="text-gray-600 hover:text-gray-400 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="Report post"
              >
                <Flag size={14} />
              </button>
            </div>
            
            <Link href={`/post/${post.id}`} className="block">
              <p className="text-base text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            </Link>

            <div className="flex justify-between items-center text-gray-500 max-w-sm">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-colors group min-h-[44px] ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
              >
                <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                  <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                </div>
                <span className="text-xs font-medium">{likeCount}</span>
              </button>
              <button 
                onClick={handleRepost}
                className={`flex items-center gap-1.5 transition-colors group min-h-[44px] ${isReposted ? 'text-green-500' : 'hover:text-green-500'}`}
              >
                <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                  <Repeat2 size={18} />
                </div>
                <span className="text-xs font-medium">{repostCount}</span>
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group min-h-[44px]"
              >
                <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                  <Share size={18} />
                </div>
              </button>
              <button 
                onClick={handleSave}
                className={`flex items-center gap-1.5 transition-colors group min-h-[44px] ${isSaved ? 'text-yellow-500' : 'hover:text-yellow-500'}`}
              >
                <div className="p-2 rounded-full group-hover:bg-yellow-500/10 transition-colors">
                  <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </article>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        post={post} 
      />
    </>
  );
}
