'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { BottomNav } from '@/components/BottomNav';
import { PostCard } from '@/components/PostCard';
import { LogOut, Settings, Link as LinkIcon, Instagram, Twitter, Edit3, X, Camera, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';

import { Suspense } from 'react';

function ProfileContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    website: '',
    instagram: '',
    twitter: '',
    default_anonymous: false
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewId = searchParams.get('id');

  const [viewProfile, setViewProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const isOwnProfile = !viewId || viewId === user?.id;
  const fetchingRef = useRef(false);

  const fetchProfileData = async () => {
    const targetId = viewId || user?.id;
    if (!targetId || fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    // Basic UUID validation to prevent Supabase errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetId)) {
      console.error('Invalid user ID format:', targetId);
      setLoading(false);
      return;
    }

    try {
      // Fetch profile info
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      let currentProfile = profileData;

      if (!currentProfile) {
        if (isOwnProfile && user) {
          // Create a default profile if it doesn't exist for the current user
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              alias: `User_${user.id.slice(0, 5)}`,
              college: user.user_metadata?.college || 'Unknown College',
              is_banned: false,
              post_count: 0,
              total_likes_received: 0,
              default_anonymous: true
            })
            .select()
            .single();
          
          if (createError) {
            // Handle race condition where profile was created by another process
            if (createError.code === '23505') {
              const { data: retryProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
              currentProfile = retryProfile;
            } else {
              console.error('Error creating default profile:', createError);
              throw createError;
            }
          } else {
            currentProfile = newProfile;
          }
        } else {
          console.warn('Profile not found for ID:', targetId);
          setViewProfile(null);
          setLoading(false);
          return;
        }
      }

      setViewProfile(currentProfile);

      // Fetch posts
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles (alias, display_name, avatar_url)
        `)
        .eq('user_id', targetId)
        .order('created_at', { ascending: false });
      
      // If not own profile, only show non-anonymous posts
      if (!isOwnProfile) {
        query = query.eq('is_anonymous', false);
      }

      const { data: postsData, error: postsError } = await query;
      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Initialize edit form if own profile
      if (isOwnProfile && currentProfile) {
        setEditForm({
          display_name: currentProfile.display_name || '',
          bio: currentProfile.bio || '',
          website: currentProfile.website || '',
          instagram: currentProfile.instagram || '',
          twitter: currentProfile.twitter || '',
          default_anonymous: currentProfile.default_anonymous || false
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile data:', error);
      setError(error.message || 'Failed to fetch profile data');
      if (error.message) console.error('Error message:', error.message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!authLoading && !user && !viewId) {
      router.push('/login');
      return;
    }
    if (user || viewId) {
      fetchProfileData();
    }
  }, [user, authLoading, router, viewId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleAvatarClick = () => {
    if (isOwnProfile) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setViewProfile({ ...viewProfile, avatar_url: publicUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name,
          bio: editForm.bio,
          website: editForm.website,
          instagram: editForm.instagram,
          twitter: editForm.twitter,
          default_anonymous: editForm.default_anonymous,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setIsEditModalOpen(false);
      fetchProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user!.id);

      if (error) throw error;
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (authLoading || (loading && !viewProfile)) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  if (!viewProfile) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        {error ? (
          <>
            <p className="text-red-500 mb-4 text-center">{error}</p>
            <button 
              onClick={fetchProfileData}
              className="px-6 py-2 bg-white text-black font-bold rounded-full mb-4"
            >
              Retry
            </button>
          </>
        ) : (
          <p className="text-gray-400 mb-4">Profile not found.</p>
        )}
        <Link href="/feed" className="px-6 py-2 bg-gray-900 text-white font-bold rounded-full">Back to Feed</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {!isOwnProfile && (
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-xl font-black tracking-tighter uppercase">
            {isOwnProfile ? 'Profile' : viewProfile.alias}
          </h1>
        </div>
        {isOwnProfile && (
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={20} />
          </button>
        )}
      </header>

      <main className="max-w-md mx-auto">
        {/* Profile Info Section */}
        <div className="p-6 flex flex-col items-center text-center">
          <div 
            className={`relative w-24 h-24 rounded-full mb-4 overflow-hidden bg-gray-800 flex items-center justify-center text-3xl font-black ${isOwnProfile ? 'cursor-pointer group' : ''}`}
            onClick={handleAvatarClick}
          >
            {viewProfile.avatar_url ? (
              <Image 
                src={viewProfile.avatar_url} 
                alt={viewProfile.alias} 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              viewProfile.alias.charAt(0).toUpperCase()
            )}
            
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleAvatarUpload} 
          />

          <h2 className="text-2xl font-bold tracking-tight">
            {viewProfile.display_name || viewProfile.alias}
          </h2>
          <p className="text-gray-500 text-sm font-medium">@{viewProfile.alias}</p>
          <p className="text-gray-400 mt-1 text-sm">{viewProfile.college}</p>

          {/* Stats */}
          <div className="flex gap-8 mt-6 py-4 border-y border-gray-800 w-full justify-center">
            <div className="text-center">
              <div className="text-lg font-black">{viewProfile.post_count || 0}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black">{viewProfile.total_likes_received || 0}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Likes</div>
            </div>
          </div>

          {/* Bio & Socials */}
          <div className="mt-6 w-full text-left space-y-4">
            {viewProfile.bio && (
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {viewProfile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500">
              {viewProfile.website && (
                <a href={viewProfile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <LinkIcon size={14} />
                  {new URL(viewProfile.website).hostname}
                </a>
              )}
              {viewProfile.instagram && (
                <a href={`https://instagram.com/${viewProfile.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Instagram size={14} />
                  @{viewProfile.instagram}
                </a>
              )}
              {viewProfile.twitter && (
                <a href={`https://twitter.com/${viewProfile.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Twitter size={14} />
                  @{viewProfile.twitter}
                </a>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="mt-8 w-full py-3 bg-gray-900 border border-gray-800 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Edit3 size={16} />
              Edit Profile
            </button>
          )}
        </div>

        {/* My Posts Section */}
        <div className="mt-4">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-black uppercase tracking-tighter text-sm text-gray-400">
              {isOwnProfile ? 'My Posts' : `${viewProfile.alias}'s Posts`}
            </h3>
          </div>

          {posts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>No posts yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {posts.map((post) => (
                <div key={post.id} className="relative group">
                  <PostCard post={post} />
                  {isOwnProfile && (
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="absolute top-4 right-4 p-2 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-gray-900 rounded-t-[2rem] sm:rounded-[2rem] p-6 overflow-y-auto max-h-[90vh] border-t sm:border border-gray-800"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Edit Profile</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-white transition-all"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-500">Bio</label>
                      <span className={`text-[10px] font-bold ${editForm.bio.length > 300 ? 'text-red-500' : 'text-gray-600'}`}>
                        {editForm.bio.length}/300
                      </span>
                    </div>
                    <textarea 
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value.slice(0, 300) })}
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-white transition-all min-h-[100px] resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Website</label>
                    <input 
                      type="url" 
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-white transition-all"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Instagram</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                        <input 
                          type="text" 
                          value={editForm.instagram}
                          onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                          className="w-full bg-black border border-gray-800 rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-1 focus:ring-white transition-all"
                          placeholder="handle"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Twitter</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                        <input 
                          type="text" 
                          value={editForm.twitter}
                          onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                          className="w-full bg-black border border-gray-800 rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-1 focus:ring-white transition-all"
                          placeholder="handle"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black border border-gray-800 rounded-2xl">
                    <div>
                      <div className="text-sm font-bold">Always post anonymously</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Default preference</div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEditForm({ ...editForm, default_anonymous: !editForm.default_anonymous })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${editForm.default_anonymous ? 'bg-white' : 'bg-gray-800'}`}
                    >
                      <motion.div 
                        animate={{ x: editForm.default_anonymous ? 24 : 4 }}
                        className={`absolute top-1 w-4 h-4 rounded-full ${editForm.default_anonymous ? 'bg-black' : 'bg-gray-400'}`}
                      />
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
