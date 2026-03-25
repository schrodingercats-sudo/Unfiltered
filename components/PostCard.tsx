'use client';

import { useState, useEffect } from 'react';
import { Heart, Repeat2, Share, Bookmark, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { ShareModal } from '@/components/ShareModal';

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
      // Check like
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user!.id)
        .eq('post_id', post.id)
        .single();
      if (likeData) setIsLiked(true);

      // Check save
      const { data: saveData } = await supabase
        .from('saves')
        .select('id')
        .eq('user_id', user!.id)
        .eq('post_id', post.id)
        .single();
      if (saveData) setIsSaved(true);

      // Check repost
      const { data: repostData } = await supabase
        .from('reposts')
        .select('id')
        .eq('user_id', user!.id)
        .eq('post_id', post.id)
        .single();
      if (repostData) setIsReposted(true);
    };

    if (user) {
      checkInteractions();
    }
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

  return (
    <>
      <article className="p-4 hover:bg-gray-900/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <div className="font-bold text-gray-300">
            {post.is_anonymous ? 'Anonymous' : post.profiles?.alias || 'Unknown'}
          </div>
          <div className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </div>
        </div>
        
        <p className="text-lg mb-4 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>

        <div className="flex justify-between items-center text-gray-500">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-xs font-medium">{likeCount}</span>
          </button>
          <button 
            onClick={handleRepost}
            className={`flex items-center gap-1.5 transition-colors ${isReposted ? 'text-green-500' : 'hover:text-green-500'}`}
          >
            <Repeat2 size={18} />
            <span className="text-xs font-medium">{repostCount}</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"
          >
            <Share size={18} />
          </button>
          <button 
            onClick={handleSave}
            className={`flex items-center gap-1.5 transition-colors ${isSaved ? 'text-yellow-500' : 'hover:text-yellow-500'}`}
          >
            <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <button 
            onClick={handleReport}
            className="flex items-center gap-1.5 hover:text-gray-300 transition-colors"
          >
            <Flag size={18} />
          </button>
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
