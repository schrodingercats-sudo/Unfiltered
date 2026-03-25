'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface WritePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export function WritePostModal({ isOpen, onClose, onPostCreated }: WritePostModalProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  if (!isOpen) return null;

  const handlePost = async () => {
    if (!content.trim() || loading) return;
    if (content.length > 500) {
      setError('Post must be under 500 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Moderation Check
      const modRes = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });

      if (!modRes.ok) {
        throw new Error('Moderation check failed');
      }

      const modData = await modRes.json();

      if (modData.flagged) {
        if (modData.banUser && user?.id) {
          // Ban the user
          await supabase.from('profiles').update({ is_banned: true }).eq('id', user.id);
          
          setError('Your account has been banned for using severe profanity.');
          setLoading(false);
          
          // Sign out the user
          setTimeout(async () => {
            await supabase.auth.signOut();
            window.location.href = '/';
          }, 3000);
          return;
        }

        setError(`This violates guidelines: ${modData.reason || 'Inappropriate content'}`);
        setLoading(false);
        return;
      }

      // 2. Insert Post
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user?.id,
        content: content.trim(),
        is_anonymous: isAnonymous,
        status: 'active',
      });

      if (insertError) throw insertError;

      setContent('');
      onPostCreated();
      onClose();
      // Start 30s cooldown
      setCooldown(30);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Post error:', err);
      setError(err.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-0">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <button
            onClick={handlePost}
            disabled={loading || !content.trim() || cooldown > 0}
            className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {cooldown > 0 ? `Wait ${cooldown}s` : 'Post'}
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? (Unfiltered)"
            className="w-full h-40 bg-transparent text-xl text-white placeholder-gray-600 resize-none outline-none"
            maxLength={500}
            autoFocus
          />

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 font-medium">
              {content.length}/500
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className={`text-sm font-medium transition-colors ${isAnonymous ? 'text-white' : 'text-gray-500'}`}>
                {isAnonymous ? 'Anonymous' : profile?.alias || 'Show Alias'}
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-white' : 'bg-gray-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-black w-4 h-4 rounded-full transition-transform ${isAnonymous ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
