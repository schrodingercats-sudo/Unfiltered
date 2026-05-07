'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Repeat2, Share, Bookmark, Flag, MoreHorizontal, Pencil, Trash2, X, Loader2 } from 'lucide-react';
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
  onPostUpdated?: () => void;
  onPostDeleted?: () => void;
}

export function PostCard({ post, onPostUpdated, onPostDeleted }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [repostCount, setRepostCount] = useState(post.repost_count);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const busyRef = useRef<Record<string, boolean>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.id === post.user_id;

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

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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

  const handleDelete = () => guard('delete', async () => {
    if (!user || !isOwner) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;
    const { error } = await supabase
      .from('posts')
      .update({ status: 'deleted' })
      .eq('id', post.id)
      .eq('user_id', user.id);
    if (error) {
      console.error('Delete error:', error);
      alert('Failed to delete post.');
    } else {
      onPostDeleted?.();
    }
    setShowMenu(false);
  });

  const handleEditSave = async () => {
    if (!user || !isOwner || editLoading) return;
    if (!editContent.trim()) {
      setEditError('Post cannot be empty.');
      return;
    }
    if (editContent.length > 500) {
      setEditError('Post must be under 500 characters.');
      return;
    }

    setEditLoading(true);
    setEditError('');

    try {
      // Run moderation on edited content
      const modRes = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editContent }),
      });

      if (!modRes.ok) throw new Error('Moderation check failed');

      const modData = await modRes.json();
      if (modData.flagged) {
        setEditError(`This violates guidelines: ${modData.reason || 'Inappropriate content'}`);
        setEditLoading(false);
        return;
      }

      const { error } = await supabase
        .from('posts')
        .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', post.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsEditing(false);
      onPostUpdated?.();
    } catch (err: any) {
      console.error('Edit error:', err);
      setEditError(err.message || 'Failed to update post.');
    } finally {
      setEditLoading(false);
    }
  };

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
                  {post.updated_at && post.updated_at !== post.created_at && (
                    <span className="ml-1 text-gray-600">(edited)</span>
                  )}
                </div>
              </div>

              {/* Post menu (owner) or Report (others) */}
              <div className="relative" ref={menuRef}>
                {isOwner ? (
                  <>
                    <button 
                      onClick={() => setShowMenu(!showMenu)}
                      className="text-gray-600 hover:text-gray-400 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 top-8 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-20 overflow-hidden min-w-[140px]">
                        <button
                          onClick={() => { setIsEditing(true); setEditContent(post.content); setShowMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={handleReport}
                    className="text-gray-600 hover:text-gray-400 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                    title="Report post"
                  >
                    <Flag size={14} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Edit mode */}
            {isEditing ? (
              <div className="mb-4 space-y-3">
                {editError && (
                  <div className="p-2 bg-red-900/50 border border-red-500 text-red-200 rounded-lg text-xs">
                    {editError}
                  </div>
                )}
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white resize-none outline-none focus:ring-1 focus:ring-white/30 transition-all min-h-[80px]"
                  maxLength={500}
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-medium">{editContent.length}/500</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setIsEditing(false); setEditError(''); }}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSave}
                      disabled={editLoading || !editContent.trim()}
                      className="px-4 py-1.5 text-xs font-bold bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {editLoading && <Loader2 size={12} className="animate-spin" />}
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href={`/post/${post.id}`} className="block">
                <p className="text-base text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>
              </Link>
            )}

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
