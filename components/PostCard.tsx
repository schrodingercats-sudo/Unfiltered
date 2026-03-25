'use client';

import { useState, useEffect } from 'react';
import { Heart, Repeat2, Share, Bookmark, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { ShareModal } from '@/components/ShareModal';
import Image from 'next/image';
import Link from 'next/link';

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

  useEffect(() => {
    const checkInteractions = async () => {
      if (!user) return;
      // Check like
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .single();
      if (likeData) setIsLiked(true);

      // Check save
      const { data: saveData } = await supabase
        .from('saves')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .single();
      if (saveData) setIsSaved(true);

      // Check repost
      const { data: repostData } = await supabase
        .from('reposts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .single();
      if (repostData) setIsReposted(true);
    };

    checkInteractions();
  }, [user, post.id]);

  const handleLike = async () => {
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
  };

  const handleSave = async () => {
    if (!user) return;
    if (isSaved) {
      setIsSaved(false);
      await supabase.from('saves').delete().eq('user_id', user.id).eq('post_id', post.id);
    } else {
      setIsSaved(true);
      await supabase.from('saves').insert({ user_id: user.id, post_id: post.id });
    }
  };

  const handleRepost = async () => {
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
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleReport = async () => {
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
  };

  const authorName = post.is_anonymous ? 'Anonymous' : (post.profiles?.display_name || post.profiles?.alias || 'Unknown');
  const authorAlias = post.is_anonymous ? null : post.profiles?.alias;
  const authorAvatar = post.is_anonymous ? null : post.profiles?.avatar_url;

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
                className="text-gray-600 hover:text-gray-400 transition-colors"
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
                className={`flex items-center gap-1.5 transition-colors group ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
              >
                <div className={`p-2 rounded-full group-hover:bg-red-500/10 transition-colors`}>
                  <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                </div>
                <span className="text-xs font-medium">{likeCount}</span>
              </button>
              <button 
                onClick={handleRepost}
                className={`flex items-center gap-1.5 transition-colors group ${isReposted ? 'text-green-500' : 'hover:text-green-500'}`}
              >
                <div className={`p-2 rounded-full group-hover:bg-green-500/10 transition-colors`}>
                  <Repeat2 size={18} />
                </div>
                <span className="text-xs font-medium">{repostCount}</span>
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group"
              >
                <div className={`p-2 rounded-full group-hover:bg-blue-500/10 transition-colors`}>
                  <Share size={18} />
                </div>
              </button>
              <button 
                onClick={handleSave}
                className={`flex items-center gap-1.5 transition-colors group ${isSaved ? 'text-yellow-500' : 'hover:text-yellow-500'}`}
              >
                <div className={`p-2 rounded-full group-hover:bg-yellow-500/10 transition-colors`}>
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
