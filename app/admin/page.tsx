'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  ShieldAlert, LayoutDashboard, FileText, Flag, Users, Shield, Settings,
  CheckCircle, Trash2, Ban, Eye, EyeOff, Search, ChevronLeft, ChevronRight,
  Plus, X, AlertTriangle, LogOut, RefreshCw, UserPlus, Bell, ArrowLeft
} from 'lucide-react';

type Tab = 'dashboard' | 'posts' | 'reports' | 'users' | 'words' | 'settings';

async function logActivity(action: string, targetType: string, targetId: string, details?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('admin_activity_log').insert({
      admin_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || null,
    });
  } catch (err) {
    console.error('Activity log error:', err);
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function AdminPanel() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role !== 'admin') router.push('/feed');
    }
    if (!authLoading && !user) router.push('/login');
  }, [profile, user, authLoading, router]);

  if (authLoading || !profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-white/50 font-medium">Verifying admin access...</span>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'posts', label: 'Posts', icon: FileText },
    { key: 'reports', label: 'Reports', icon: Flag },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'words', label: 'Blocked Words', icon: Shield },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/feed')} className="text-white/40 hover:text-white transition-colors md:hidden">
              <ArrowLeft size={20} />
            </button>
            <ShieldAlert size={20} className="text-red-500" />
            <h1 className="text-lg font-black tracking-tight uppercase">Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/feed')}
              className="hidden md:flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Back to App
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/40 hover:text-white"
            >
              {mobileMenuOpen ? <X size={20} /> : <LayoutDashboard size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar - Desktop */}
        <nav className="hidden md:flex flex-col w-56 min-h-[calc(100vh-3.5rem)] border-r border-white/5 py-4 px-2 sticky top-14 h-[calc(100vh-3.5rem)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                activeTab === tab.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-14 z-40 bg-[#0a0a0a] border-b border-white/5 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all w-full ${
                  activeTab === tab.key ? 'bg-white/10 text-white' : 'text-white/40'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 min-h-[calc(100vh-3.5rem)]">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'posts' && <PostsTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'words' && <BlockedWordsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────
function StatCard({ label, value, color = 'white' }: { label: string; value: number | string; color?: string }) {
  const colorStyles: Record<string, string> = {
    white: 'border-white/5 text-white',
    red: 'border-red-500/20 text-red-400',
    yellow: 'border-yellow-500/20 text-yellow-400',
    green: 'border-green-500/20 text-green-400',
  };
  return (
    <div className={`bg-white/[0.02] border ${colorStyles[color] || colorStyles.white} rounded-xl p-4`}>
      <div className="text-[11px] uppercase tracking-widest text-white/30 font-bold mb-2">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

// ─── TAB 1: DASHBOARD ─────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState({
    totalPosts: 0, todayPosts: 0, pendingReports: 0, activeUsers: 0,
    hiddenPosts: 0, bannedUsers: 0, totalReports: 0, blockedWords: 0,
  });
  const [postsPerDay, setPostsPerDay] = useState<{ day: string; count: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        { count: totalPosts },
        { count: todayPosts },
        { count: pendingReports },
        { count: activeUsers },
        { count: hiddenPosts },
        { count: bannedUsers },
        { count: totalReports },
        { count: blockedWordsCount },
      ] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', false),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'hidden'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('blocked_words').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalPosts: totalPosts || 0,
        todayPosts: todayPosts || 0,
        pendingReports: pendingReports || 0,
        activeUsers: activeUsers || 0,
        hiddenPosts: hiddenPosts || 0,
        bannedUsers: bannedUsers || 0,
        totalReports: totalReports || 0,
        blockedWords: blockedWordsCount || 0,
      });

      // Posts per day (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (recentPosts) {
        const dayMap: Record<string, number> = {};
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          dayMap[key] = 0;
        }
        recentPosts.forEach((p) => {
          const key = p.created_at.slice(0, 10);
          if (dayMap[key] !== undefined) dayMap[key]++;
        });
        setPostsPerDay(
          Object.entries(dayMap).map(([key, count]) => ({
            day: dayNames[new Date(key).getDay()],
            count,
          }))
        );
      }

      // Recent activity
      const { data: recentReports } = await supabase
        .from('reports')
        .select('*, posts(content)')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('alias, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const combined: any[] = [];
      recentReports?.forEach((r) => combined.push({ type: 'report', time: r.created_at, text: `Report on "${(r.posts as any)?.content?.slice(0, 40)}..."` }));
      recentUsers?.forEach((u) => combined.push({ type: 'signup', time: u.created_at, text: `New user: ${u.alias}` }));

      // Admin activity log
      try {
        const { data: adminLogs } = await supabase
          .from('admin_activity_log')
          .select('action, details, created_at')
          .order('created_at', { ascending: false })
          .limit(5);
        adminLogs?.forEach((l) => combined.push({ type: 'admin', time: l.created_at, text: `Admin: ${l.action}${l.details ? ` — ${l.details}` : ''}` }));
      } catch {}

      combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(combined.slice(0, 15));
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12 text-white/30">Loading dashboard...</div>;

  const maxCount = Math.max(...postsPerDay.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Posts" value={stats.totalPosts} />
        <StatCard label="Today's Posts" value={stats.todayPosts} color="green" />
        <StatCard label="Pending Reports" value={stats.pendingReports} color="yellow" />
        <StatCard label="Active Users" value={stats.activeUsers} />
        <StatCard label="Hidden Posts" value={stats.hiddenPosts} color="red" />
        <StatCard label="Banned Users" value={stats.bannedUsers} color="red" />
        <StatCard label="Total Reports" value={stats.totalReports} color="yellow" />
        <StatCard label="Blocked Words" value={stats.blockedWords} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Posts Per Day */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Posts per Day (7 Days)</h3>
          <div className="space-y-2">
            {postsPerDay.map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs text-white/40 w-8 font-mono">{d.day}</span>
                <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-white/20 to-white/10 rounded-full transition-all"
                    style={{ width: `${(d.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-white/50 font-mono w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-white/20 text-sm">No recent activity</p>
            ) : (
              recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5">{a.type === 'report' ? '🚩' : a.type === 'admin' ? '⚡' : '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/60 truncate">{a.text}</p>
                    <p className="text-white/20 text-xs">{formatDistanceToNow(new Date(a.time), { addSuffix: true })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: POSTS MANAGEMENT ──────────────────────────────────
function PostsTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('*, profiles:user_id (alias, email, college, is_banned, role)')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filter !== 'all') query = query.eq('status', filter);
      if (search) query = query.ilike('content', `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Posts error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleAction = async (action: string, postId: string, userId?: string) => {
    try {
      if (action === 'approve') {
        await supabase.from('posts').update({ status: 'active' }).eq('id', postId);
        await logActivity('approve_post', 'post', postId);
      } else if (action === 'hide') {
        await supabase.from('posts').update({ status: 'hidden' }).eq('id', postId);
        await logActivity('hide_post', 'post', postId);
      } else if (action === 'delete') {
        if (!confirm('Soft-delete this post?')) return;
        await supabase.from('posts').update({ status: 'deleted' }).eq('id', postId);
        await logActivity('delete_post', 'post', postId);
      } else if (action === 'ban' && userId) {
        if (!confirm(`Ban user ${userId.slice(0, 8)}...? This hides all their posts.`)) return;
        await supabase.from('profiles').update({ is_banned: true }).eq('id', userId);
        await supabase.from('posts').update({ status: 'hidden' }).eq('user_id', userId);
        await logActivity('ban_user', 'user', userId, `Banned from post ${postId}`);
      }
      fetchPosts();
    } catch (err) {
      console.error('Action error:', err);
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    hidden: 'bg-red-500/10 text-red-400 border-red-500/20',
    under_review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    deleted: 'bg-white/5 text-white/30 border-white/10',
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {['all', 'active', 'hidden', 'under_review', 'deleted'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-colors ${
                filter === f ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search posts..."
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 text-white/30">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center p-12 text-white/20 bg-white/[0.02] rounded-xl border border-white/5">No posts found.</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-white/70">
                      {post.is_anonymous ? 'Anonymous' : post.profiles?.alias || 'Unknown'}
                    </span>
                    <span className="text-[10px] font-mono text-white/20">{post.user_id.slice(0, 8)}</span>
                    {post.profiles?.email && (
                      <span className="text-[10px] text-white/15">{post.profiles.email.slice(0, 4)}***</span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/20">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    {post.profiles?.college && ` · ${post.profiles.college}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${statusColors[post.status] || statusColors.active}`}>
                    {post.status}
                  </span>
                  {post.report_count > 0 && (
                    <span className="text-[10px] text-red-400">🚩 {post.report_count}</span>
                  )}
                </div>
              </div>

              <p className="text-sm text-white/60 mb-4 whitespace-pre-wrap border-l-2 border-white/5 pl-3 py-1">{post.content}</p>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                {post.status !== 'active' && (
                  <button onClick={() => handleAction('approve', post.id)} className="admin-btn bg-green-500/10 text-green-400 hover:bg-green-500/20">
                    <CheckCircle size={14} /> Approve
                  </button>
                )}
                {post.status === 'active' && (
                  <button onClick={() => handleAction('hide', post.id)} className="admin-btn bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20">
                    <EyeOff size={14} /> Hide
                  </button>
                )}
                <button onClick={() => handleAction('delete', post.id)} className="admin-btn bg-red-500/10 text-red-400 hover:bg-red-500/20">
                  <Trash2 size={14} /> Delete
                </button>
                <button onClick={() => handleAction('ban', post.id, post.user_id)} className="admin-btn bg-white/5 text-white/40 hover:bg-white/10 ml-auto">
                  <Ban size={14} /> Ban User
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-3 pt-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="admin-btn bg-white/5 text-white/40 hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="text-xs text-white/30 self-center font-mono">Page {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={posts.length < PAGE_SIZE}
          className="admin-btn bg-white/5 text-white/40 hover:bg-white/10 disabled:opacity-30"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── TAB 3: REPORTS QUEUE ─────────────────────────────────────
function ReportsTab() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, posts(id, content, status, user_id, profiles:user_id(alias, email))')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Reports error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleDismiss = async (reportId: string) => {
    await supabase.from('reports').delete().eq('id', reportId);
    await logActivity('dismiss_report', 'report', reportId);
    fetchReports();
  };

  const handleDeletePost = async (postId: string, reportId: string) => {
    if (!confirm('Delete this post?')) return;
    await supabase.from('posts').update({ status: 'deleted' }).eq('id', postId);
    await supabase.from('reports').delete().eq('post_id', postId);
    await logActivity('delete_post_from_report', 'post', postId);
    fetchReports();
  };

  const handleBanPoster = async (userId: string) => {
    if (!confirm('Ban this user and hide all their posts?')) return;
    await supabase.from('profiles').update({ is_banned: true }).eq('id', userId);
    await supabase.from('posts').update({ status: 'hidden' }).eq('user_id', userId);
    await logActivity('ban_user', 'user', userId, 'Banned from reports queue');
    fetchReports();
  };

  if (loading) return <div className="text-center p-12 text-white/30">Loading reports...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">Reports Queue ({reports.length})</h2>
        <button onClick={fetchReports} className="admin-btn bg-white/5 text-white/30 hover:bg-white/10">
          <RefreshCw size={14} />
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center p-12 text-white/20 bg-white/[0.02] rounded-xl border border-white/5">
          No reports pending. 🎉
        </div>
      ) : (
        reports.map((report) => (
          <div key={report.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-bold uppercase text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                  {report.reason || 'Reported'}
                </span>
                <span className="text-[11px] text-white/20 ml-3">
                  {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                </span>
              </div>
              <span className="text-[10px] font-mono text-white/15">#{report.id.slice(0, 8)}</span>
            </div>

            {report.posts && (
              <div className="mb-4">
                <p className="text-sm text-white/50 whitespace-pre-wrap border-l-2 border-yellow-500/20 pl-3 py-1">
                  {(report.posts as any).content?.slice(0, 200)}
                  {(report.posts as any).content?.length > 200 && '...'}
                </p>
                <div className="text-[11px] text-white/20 mt-2">
                  Posted by: {(report.posts as any).profiles?.alias || 'Unknown'}
                  {(report.posts as any).profiles?.email && ` (${(report.posts as any).profiles.email.slice(0, 4)}***)`}
                  {' · '}Post status: {(report.posts as any).status}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
              <button onClick={() => handleDismiss(report.id)} className="admin-btn bg-white/5 text-white/40 hover:bg-white/10">
                <CheckCircle size={14} /> Dismiss
              </button>
              {report.posts && (
                <>
                  <button onClick={() => handleDeletePost((report.posts as any).id, report.id)} className="admin-btn bg-red-500/10 text-red-400 hover:bg-red-500/20">
                    <Trash2 size={14} /> Delete Post
                  </button>
                  <button onClick={() => handleBanPoster((report.posts as any).user_id)} className="admin-btn bg-red-500/10 text-red-400 hover:bg-red-500/20 ml-auto">
                    <Ban size={14} /> Ban Poster
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── TAB 4: USER MANAGEMENT ──────────────────────────────────
function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filter === 'active') query = query.eq('is_banned', false);
      if (filter === 'banned') query = query.eq('is_banned', true);
      if (filter === 'admin') query = query.eq('role', 'admin');
      if (search) query = query.or(`alias.ilike.%${search}%,email.ilike.%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Users error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleBan = async (userId: string) => {
    if (userId === currentUser?.id) return alert("You can't ban yourself.");
    if (!confirm('Ban this user?')) return;
    await supabase.from('profiles').update({ is_banned: true }).eq('id', userId);
    await supabase.from('posts').update({ status: 'hidden' }).eq('user_id', userId);
    await logActivity('ban_user', 'user', userId);
    fetchUsers();
  };

  const handleUnban = async (userId: string) => {
    await supabase.from('profiles').update({ is_banned: false }).eq('id', userId);
    await logActivity('unban_user', 'user', userId);
    fetchUsers();
  };

  const handleMakeAdmin = async (userId: string) => {
    if (!confirm('Give this user FULL admin access?')) return;
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
    await logActivity('make_admin', 'user', userId);
    fetchUsers();
  };

  const getRisk = (u: any) => {
    const score = (u.report_count || 0) * 3;
    if (score >= 31) return { label: 'High', color: 'text-red-400 bg-red-500/10' };
    if (score >= 11) return { label: 'Med', color: 'text-yellow-400 bg-yellow-500/10' };
    return { label: 'Low', color: 'text-green-400 bg-green-500/10' };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {['all', 'active', 'banned', 'admin'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-colors ${
                filter === f ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by alias or email..."
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 text-white/30">Loading users...</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const risk = getRisk(u);
            return (
              <div key={u.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white/70">{u.display_name || u.alias}</span>
                      <span className="text-[10px] text-white/20">@{u.alias}</span>
                      {u.role === 'admin' && (
                        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">ADMIN</span>
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${risk.color}`}>{risk.label}</span>
                    </div>
                    <div className="text-[11px] text-white/20 mt-1">
                      {u.email?.slice(0, 4)}***@{u.email?.split('@')[1]}
                      {u.college && ` · ${u.college}`}
                      {' · '}Joined {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {u.is_banned && (
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">BANNED</span>
                  )}
                </div>

                <div className="text-[11px] text-white/20 mb-3">
                  Posts: {u.post_count || 0} · Likes: {u.total_likes_received || 0}
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                  {!u.is_banned ? (
                    <button onClick={() => handleBan(u.id)} className="admin-btn bg-red-500/10 text-red-400 hover:bg-red-500/20">
                      <Ban size={14} /> Ban
                    </button>
                  ) : (
                    <button onClick={() => handleUnban(u.id)} className="admin-btn bg-green-500/10 text-green-400 hover:bg-green-500/20">
                      <CheckCircle size={14} /> Unban
                    </button>
                  )}
                  {u.role !== 'admin' && (
                    <button onClick={() => handleMakeAdmin(u.id)} className="admin-btn bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20">
                      <Shield size={14} /> Make Admin
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center gap-3 pt-4">
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="admin-btn bg-white/5 text-white/40 disabled:opacity-30">
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="text-xs text-white/30 self-center font-mono">Page {page + 1}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={users.length < PAGE_SIZE} className="admin-btn bg-white/5 text-white/40 disabled:opacity-30">
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── TAB 5: BLOCKED WORDS ────────────────────────────────────
function BlockedWordsTab() {
  const { user } = useAuth();
  const [newWord, setNewWord] = useState('');
  const [newLang, setNewLang] = useState('hindi');
  const [bulkWords, setBulkWords] = useState('');
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [addingVariations, setAddingVariations] = useState(false);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('blocked_words').select('*').order('created_at', { ascending: false });
      if (langFilter !== 'all') query = query.eq('language', langFilter);
      if (searchTerm) query = query.ilike('word', `%${searchTerm}%`);
      const { data, error } = await query;
      if (error) throw error;
      setWords(data || []);
    } catch (err) {
      console.error('Blocked words error:', err);
    } finally {
      setLoading(false);
    }
  }, [langFilter, searchTerm]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  const generateVariations = (word: string) => {
    const variations = [word];
    variations.push(word.split('').join(' '));
    variations.push(word.split('').join('.'));
    const leet: Record<string, string> = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', l: '1' };
    let leetVersion = '';
    for (const c of word) leetVersion += leet[c] || c;
    if (leetVersion !== word) variations.push(leetVersion);
    variations.push(word.split('').join('_'));
    return [...new Set(variations)];
  };

  const handleAddWord = async (withVariations = false) => {
    if (!newWord.trim()) return;
    const wordsToAdd = withVariations
      ? generateVariations(newWord.toLowerCase().trim())
      : [newWord.toLowerCase().trim()];
    try {
      const rows = wordsToAdd.map((w) => ({ word: w, language: newLang, added_by: user?.id }));
      const { error } = await supabase.from('blocked_words').upsert(rows, { onConflict: 'word' });
      if (error) throw error;
      await logActivity('add_word', 'word', newWord, `Added ${wordsToAdd.length} word(s)`);
      setNewWord('');
      fetchWords();
    } catch (err) {
      console.error('Add word error:', err);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkWords.trim()) return;
    const wordList = bulkWords.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
    if (wordList.length === 0) return;
    try {
      const rows = wordList.map((w) => ({ word: w, language: newLang, added_by: user?.id }));
      const { error } = await supabase.from('blocked_words').upsert(rows, { onConflict: 'word' });
      if (error) throw error;
      await logActivity('bulk_add_words', 'word', '', `Bulk added ${wordList.length} words`);
      setBulkWords('');
      fetchWords();
    } catch (err) {
      console.error('Bulk add error:', err);
    }
  };

  const handleDeleteWord = async (wordId: string, wordText: string) => {
    try {
      await supabase.from('blocked_words').delete().eq('id', wordId);
      await logActivity('delete_word', 'word', wordId, `Removed "${wordText}"`);
      fetchWords();
    } catch (err) {
      console.error('Delete word error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Word */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Add New Word</h3>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Enter blocked word..."
            className="flex-1 min-w-[200px] bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/20 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleAddWord(false)}
          />
          <select
            value={newLang}
            onChange={(e) => setNewLang(e.target.value)}
            className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none text-white"
          >
            <option value="hindi">Hindi</option>
            <option value="english">English</option>
            <option value="hinglish">Hinglish</option>
          </select>
          <button onClick={() => handleAddWord(false)} className="admin-btn bg-white/10 text-white hover:bg-white/20">
            <Plus size={14} /> Add
          </button>
        </div>

        {newWord && (
          <div className="mt-4 p-3 bg-white/[0.02] rounded-lg">
            <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">Auto-generated variations</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {generateVariations(newWord.toLowerCase()).map((v, i) => (
                <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded text-white/50 font-mono">{v}</span>
              ))}
            </div>
            <button onClick={() => handleAddWord(true)} className="admin-btn bg-green-500/10 text-green-400 hover:bg-green-500/20">
              <Plus size={14} /> Add word + all variations
            </button>
          </div>
        )}
      </div>

      {/* Bulk Add */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Bulk Add</h3>
        <textarea
          value={bulkWords}
          onChange={(e) => setBulkWords(e.target.value)}
          placeholder="Paste comma-separated words..."
          className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/20 transition-colors min-h-[80px] resize-none"
        />
        <button onClick={handleBulkAdd} className="admin-btn bg-white/10 text-white hover:bg-white/20 mt-3">
          <Plus size={14} /> Add All
        </button>
      </div>

      {/* Word List */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">
            Current Words ({words.length})
          </h3>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              {['all', 'hindi', 'english', 'hinglish'].map((l) => (
                <button key={l} onClick={() => setLangFilter(l)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${langFilter === l ? 'bg-white/10 text-white' : 'text-white/30'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter..."
                className="bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-white/20 transition-colors w-40"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-8 text-white/20">Loading...</div>
        ) : words.length === 0 ? (
          <div className="text-center p-8 text-white/20">No blocked words found. Run the migration SQL first.</div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {words.map((w) => (
              <div key={w.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/60 font-mono">{w.word}</span>
                  <span className="text-[10px] text-white/15 uppercase">{w.language}</span>
                </div>
                <button onClick={() => handleDeleteWord(w.id, w.word)} className="text-red-400/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB 6: SETTINGS ────────────────────────────────────────
function SettingsTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    auto_hide_threshold: '3',
    openai_moderation_enabled: 'true',
    hindi_filter_enabled: 'true',
    max_post_length: '500',
    allow_revealed_posts: 'true',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('platform_settings').select('key, value');
      if (error) throw error;
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s) => (map[s.key] = s.value));
        setSettings((prev) => ({ ...prev, ...map }));
      }
    } catch (err) {
      console.error('Settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      await supabase.from('platform_settings').upsert(
        { key, value, updated_at: new Date().toISOString(), updated_by: user?.id },
        { onConflict: 'key' }
      );
      await logActivity('update_setting', 'setting', key, `Set ${key} = ${value}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save setting error:', err);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    saveSetting(key, value);
  };

  const handleDeleteAllPosts = async () => {
    const input = prompt('Type DELETE to confirm deleting ALL posts');
    if (input !== 'DELETE') return;
    await supabase.from('posts').update({ status: 'deleted' }).neq('status', 'deleted');
    await logActivity('delete_all_posts', 'platform', 'all', 'Deleted all posts');
    alert('All posts have been soft-deleted.');
  };

  const handleBanAllUsers = async () => {
    const input = prompt('Type BAN ALL to confirm');
    if (input !== 'BAN ALL') return;
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await supabase.from('profiles').update({ is_banned: true }).neq('id', currentUser?.id || '');
    await logActivity('ban_all_users', 'platform', 'all', 'Banned all users');
    alert('All users have been banned (except you).');
  };

  if (loading) return <div className="text-center p-12 text-white/30">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {saved && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle size={14} /> Settings saved
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">Moderation Settings</h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Auto-hide threshold</div>
            <div className="text-[11px] text-white/20">Posts auto-hide after this many reports</div>
          </div>
          <input
            type="number"
            value={settings.auto_hide_threshold}
            onChange={(e) => updateSetting('auto_hide_threshold', e.target.value || '3')}
            className="w-16 bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-white/20"
            min={1} max={50}
          />
        </div>

        <ToggleSetting
          label="OpenAI Moderation"
          description="Disable if API is down or key expired"
          value={settings.openai_moderation_enabled === 'true'}
          onChange={(v) => updateSetting('openai_moderation_enabled', String(v))}
        />

        <ToggleSetting
          label="Hindi Filter"
          description="Custom Hindi/Hinglish profanity filter"
          value={settings.hindi_filter_enabled === 'true'}
          onChange={(v) => updateSetting('hindi_filter_enabled', String(v))}
        />
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">Post Settings</h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Max post length</div>
            <div className="text-[11px] text-white/20">Character limit for posts</div>
          </div>
          <input
            type="number"
            value={settings.max_post_length}
            onChange={(e) => updateSetting('max_post_length', e.target.value || '500')}
            className="w-20 bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-white/20"
            min={100} max={5000}
          />
        </div>

        <ToggleSetting
          label="Allow revealed posts"
          description="Let users show their alias on posts"
          value={settings.allow_revealed_posts === 'true'}
          onChange={(v) => updateSetting('allow_revealed_posts', String(v))}
        />
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/[0.03] border border-red-500/10 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-red-400/50">⚠️ Danger Zone</h3>

        <div className="space-y-3">
          <button
            className="w-full admin-btn bg-red-500/10 text-red-400 hover:bg-red-500/20 justify-center py-3"
            onClick={handleDeleteAllPosts}
          >
            <Trash2 size={14} /> Delete ALL Posts
          </button>
          <button
            className="w-full admin-btn bg-red-500/10 text-red-400 hover:bg-red-500/20 justify-center py-3"
            onClick={handleBanAllUsers}
          >
            <Ban size={14} /> Ban ALL Users
          </button>
        </div>

        <p className="text-[11px] text-red-400/30">These actions are irreversible. Typing confirmation is required.</p>
      </div>
    </div>
  );
}

// ─── TOGGLE SETTING SUB-COMPONENT ────────────────────────────
function ToggleSetting({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-white/20">{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-green-500' : 'bg-white/10'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}
