'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ShieldAlert, CheckCircle, Trash2, Ban } from 'lucide-react';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [reportedPosts, setReportedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      if (profile.role !== 'admin') {
        router.push('/feed');
      } else {
        fetchReportedPosts();
      }
    }
  }, [profile, router]);

  const fetchReportedPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (alias)
        `)
        .in('status', ['under_review', 'hidden'])
        .order('report_count', { ascending: false });
      
      if (error) throw error;
      setReportedPosts(data || []);
    } catch (error) {
      console.error('Error fetching reported posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      await supabase.from('posts').update({ status: 'active', report_count: 0 }).eq('id', postId);
      await supabase.from('reports').delete().eq('post_id', postId);
      fetchReportedPosts();
    } catch (error) {
      console.error('Error approving post:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await supabase.from('posts').update({ status: 'deleted' }).eq('id', postId);
      fetchReportedPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await supabase.from('profiles').update({ is_banned: true }).eq('id', userId);
      alert('User banned.');
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  if (!profile || profile.role !== 'admin') {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex items-center gap-2">
        <ShieldAlert size={24} className="text-red-500" />
        <h1 className="text-xl font-black tracking-tighter uppercase">Admin Dashboard</h1>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-300">Reported & Hidden Posts</h2>
          <p className="text-sm text-gray-500">Review posts flagged by users or moderation.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8 text-gray-500">Loading...</div>
        ) : reportedPosts.length === 0 ? (
          <div className="flex justify-center p-8 text-gray-500 bg-gray-900/50 rounded-xl border border-gray-800">
            No posts currently require review.
          </div>
        ) : (
          <div className="space-y-4">
            {reportedPosts.map((post) => (
              <div key={post.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-bold text-gray-300 flex items-center gap-2">
                      {post.is_anonymous ? 'Anonymous' : post.profiles?.alias || 'Unknown'}
                      <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-400">
                        {post.user_id.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${post.status === 'hidden' ? 'bg-red-900/50 text-red-500' : 'bg-yellow-900/50 text-yellow-500'}`}>
                      {post.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {post.report_count} reports
                    </span>
                  </div>
                </div>
                
                <p className="text-lg mb-6 whitespace-pre-wrap leading-relaxed border-l-2 border-gray-700 pl-4 py-1">
                  {post.content}
                </p>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
                  <button 
                    onClick={() => handleApprove(post.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-900/30 text-green-500 hover:bg-green-900/50 rounded-lg text-sm font-bold transition-colors"
                  >
                    <CheckCircle size={16} />
                    Approve & Restore
                  </button>
                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/30 text-red-500 hover:bg-red-900/50 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete Post
                  </button>
                  <button 
                    onClick={() => handleBanUser(post.user_id)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg text-sm font-bold transition-colors ml-auto"
                  >
                    <Ban size={16} />
                    Ban User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
