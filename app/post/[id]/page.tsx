'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { BottomNav } from '@/components/BottomNav';
import { formatDistanceToNow } from 'date-fns';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPostAndComments = async () => {
    try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (alias)
        `)
        .eq('id', id)
        .single();
      
      if (postError) throw postError;
      setPost(postData);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (alias)
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      
      if (commentsError) throw commentsError;
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching post details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPostAndComments();
    }
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: id,
        user_id: user!.id,
        content: newComment.trim(),
      });

      if (error) throw error;
      setNewComment('');
      fetchPostAndComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <p className="text-gray-400 mb-4">Post not found or has been removed.</p>
        <Link href="/feed" className="px-6 py-2 bg-white text-black font-bold rounded-full">
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex items-center gap-4">
        <Link href="/feed" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-black tracking-tighter uppercase">Post Details</h1>
      </header>

      <main className="max-w-md mx-auto">
        {/* Original Post */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="font-bold text-gray-300">
                {post.is_anonymous ? 'Anonymous' : post.profiles?.alias || 'Unknown'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          <p className="text-xl mb-4 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Comments Section */}
        <div className="p-4 bg-gray-900/30">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
            <MessageSquare size={16} />
            Comments ({comments.length})
          </h2>

          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No comments yet. Be the first to reply!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold">
                    {comment.profiles?.alias?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-gray-300">{comment.profiles?.alias || 'Unknown'}</span>
                      <span className="text-[10px] text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Comment Input */}
      <div className="fixed bottom-16 left-0 right-0 bg-black border-t border-gray-800 p-4 max-w-md mx-auto">
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-gray-900 border border-gray-800 rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-white outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center disabled:opacity-50 transition-opacity"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
