'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { motion } from 'motion/react';
import {
  ArrowLeft, User, Shield, Bell, Eye, EyeOff, LogOut, Trash2,
  Moon, Globe, Lock, ChevronRight, ShieldCheck, Crown
} from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    default_anonymous: true,
    display_name: '',
    bio: '',
    website: '',
    instagram: '',
    twitter: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (profile) {
      setSettings({
        default_anonymous: profile.default_anonymous ?? true,
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        website: profile.website || '',
        instagram: profile.instagram || '',
        twitter: profile.twitter || '',
      });
    }
  }, [user, profile, authLoading, router]);

  const updateField = async (field: string, value: any) => {
    if (!user) return;
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Settings save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    try {
      if (!user) return;
      // Soft-delete: mark all posts as deleted and ban the profile
      await supabase.from('posts').update({ status: 'deleted' }).eq('user_id', user.id);
      await supabase.from('profiles').update({
        is_banned: true,
        ban_reason: 'Account self-deleted',
        display_name: 'Deleted User',
        bio: '',
        avatar_url: null,
      }).eq('id', user.id);
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      console.error('Delete account error:', err);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-black tracking-tighter uppercase">Settings</h1>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="ml-auto text-xs font-bold text-green-400"
          >
            ✓ Saved
          </motion.span>
        )}
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Privacy & Posting */}
        <SettingsSection title="Privacy & Posting" icon={<Eye size={16} />}>
          <ToggleRow
            label="Post anonymously by default"
            description="New posts will be anonymous unless you toggle it off"
            value={settings.default_anonymous}
            onChange={(v) => updateField('default_anonymous', v)}
          />
        </SettingsSection>

        {/* Profile */}
        <SettingsSection title="Profile" icon={<User size={16} />}>
          <InputRow
            label="Display Name"
            value={settings.display_name}
            placeholder="Your name"
            onSave={(v) => updateField('display_name', v)}
          />
          <InputRow
            label="Bio"
            value={settings.bio}
            placeholder="Tell us about yourself..."
            multiline
            maxLength={300}
            onSave={(v) => updateField('bio', v)}
          />
          <InputRow
            label="Website"
            value={settings.website}
            placeholder="https://yourwebsite.com"
            onSave={(v) => updateField('website', v)}
          />
          <InputRow
            label="Instagram"
            value={settings.instagram}
            placeholder="handle"
            prefix="@"
            onSave={(v) => updateField('instagram', v)}
          />
          <InputRow
            label="Twitter / X"
            value={settings.twitter}
            placeholder="handle"
            prefix="@"
            onSave={(v) => updateField('twitter', v)}
          />
        </SettingsSection>

        {/* Account */}
        <SettingsSection title="Account" icon={<Lock size={16} />}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-xs text-white/20 mt-0.5">{user?.email || 'Not set'}</div>
            </div>
          </div>

          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">User ID</div>
              <div className="text-xs text-white/20 mt-0.5 font-mono">{user?.id?.slice(0, 16)}...</div>
            </div>
          </div>

          {profile?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Crown size={16} className="text-yellow-400" />
                <div className="text-sm font-medium text-yellow-400">Admin Panel</div>
              </div>
              <ChevronRight size={16} className="text-white/20" />
            </button>
          )}
        </SettingsSection>

        {/* Actions */}
        <SettingsSection title="Actions" icon={<Shield size={16} />}>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3.5 flex items-center gap-3 text-white/60 hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </SettingsSection>

        {/* Danger Zone */}
        <div className="bg-red-500/[0.03] border border-red-500/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-red-500/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-red-400/50 flex items-center gap-2">
              <Trash2 size={14} /> Danger Zone
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-red-400/40">
              Deleting your account will remove all your posts and profile data. This cannot be undone.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="w-full bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500/30 text-red-400 placeholder-red-400/20"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE'}
              className="w-full py-3 bg-red-500/10 text-red-400 font-bold text-sm rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Delete My Account
            </button>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center pt-8 pb-4">
          <p className="text-[10px] text-white/10 uppercase tracking-widest font-bold">
            Unfiltered v1.0 · Built with 🤍
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function SettingsSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <span className="text-white/30">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">{title}</h3>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="px-4 py-3.5 flex items-center justify-between">
      <div className="pr-4">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-white/20 mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-white' : 'bg-white/10'}`}
      >
        <motion.div
          animate={{ x: value ? 22 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-1 w-4 h-4 rounded-full ${value ? 'bg-black' : 'bg-white/40'}`}
        />
      </button>
    </div>
  );
}

function InputRow({ label, value, placeholder, prefix, multiline, maxLength, onSave }: {
  label: string; value: string; placeholder: string;
  prefix?: string; multiline?: boolean; maxLength?: number;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const handleSave = () => {
    if (draft !== value) onSave(draft);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <div>
          <div className="text-xs text-white/30 uppercase tracking-widest font-bold">{label}</div>
          <div className="text-sm text-white/60 mt-0.5">{value || <span className="text-white/15 italic">Not set</span>}</div>
        </div>
        <ChevronRight size={14} className="text-white/10" />
      </button>
    );
  }

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-white/30 uppercase tracking-widest font-bold">{label}</label>
        {maxLength && (
          <span className={`text-[10px] font-bold ${draft.length > maxLength ? 'text-red-400' : 'text-white/15'}`}>
            {draft.length}/{maxLength}
          </span>
        )}
      </div>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">{prefix}</span>}
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-white/20 min-h-[80px] resize-none"
          />
        ) : (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className={`w-full bg-white/5 border border-white/10 rounded-xl ${prefix ? 'pl-7' : 'px-3'} pr-3 py-2.5 text-sm outline-none focus:border-white/20`}
          />
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={() => { setDraft(value); setEditing(false); }} className="px-3 py-1.5 text-xs text-white/30 hover:text-white/50">
          Cancel
        </button>
        <button onClick={handleSave} className="px-4 py-1.5 text-xs font-bold bg-white text-black rounded-lg hover:bg-white/90">
          Save
        </button>
      </div>
    </div>
  );
}
