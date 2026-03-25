'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Camera, ArrowRight, User, AtSign, GraduationCap, FileText } from 'lucide-react';
import Image from 'next/image';

export default function Onboarding() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    display_name: '',
    alias: '',
    bio: '',
    college: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { key: 'identity', label: 'Your Identity' },
    { key: 'details', label: 'About You' },
    { key: 'finish', label: 'All Set' },
  ];

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.display_name.trim()) {
        setError('Please enter your name');
        return false;
      }
      if (!form.alias.trim()) {
        setError('Please choose a username');
        return false;
      }
      if (form.alias.length < 3) {
        setError('Username must be at least 3 characters');
        return false;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(form.alias)) {
        setError('Username can only contain letters, numbers, and underscores');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      let avatarUrl = profile?.avatar_url || null;

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Check alias uniqueness
      const { data: existingAlias } = await supabase
        .from('profiles')
        .select('id')
        .eq('alias', form.alias.trim())
        .neq('id', user.id)
        .maybeSingle();

      if (existingAlias) {
        setError('This username is already taken. Please choose another.');
        setLoading(false);
        return;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: form.display_name.trim(),
          alias: form.alias.trim(),
          bio: form.bio.trim(),
          college: form.college.trim() || profile?.college || 'Unknown',
          avatar_url: avatarUrl,
          onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      router.push('/feed');
      router.refresh();
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div
        className="auth-glow-orb"
        style={{ width: 250, height: 250, background: 'rgba(255,255,255,0.03)', top: '5%', left: '-10%' }}
      />

      <motion.div
        className="auth-card max-w-sm w-full relative z-10"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s.key}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-white' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Identity */}
        {step === 0 && (
          <motion.div
            key="step-0"
            className="space-y-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Set up your identity</h1>
              <p className="text-white/35 text-sm">Choose how others see you</p>
            </div>

            {/* Avatar */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/15 flex items-center justify-center overflow-hidden group hover:border-white/30 transition-colors"
              >
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                ) : (
                  <Camera size={28} className="text-white/30 group-hover:text-white/50 transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={20} className="text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                <User size={12} /> Display Name
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="auth-input"
                placeholder="Your real or display name"
                maxLength={50}
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                <AtSign size={12} /> Username
              </label>
              <input
                type="text"
                value={form.alias}
                onChange={(e) => setForm({ ...form, alias: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                className="auth-input"
                placeholder="Choose a unique username"
                maxLength={30}
              />
              <p className="text-[11px] text-white/20">Letters, numbers, and underscores only</p>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button onClick={handleNext} className="auth-btn-primary flex items-center justify-center gap-2">
              Continue <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <motion.div
            key="step-1"
            className="space-y-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Tell us more</h1>
              <p className="text-white/35 text-sm">Optional — you can skip this</p>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                <FileText size={12} /> Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 160) })}
                className="auth-input min-h-[80px] resize-none"
                placeholder="A short bio about yourself..."
                rows={3}
              />
              <p className="text-[11px] text-white/20 text-right">{form.bio.length}/160</p>
            </div>

            {/* College */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                <GraduationCap size={12} /> College / Institute
              </label>
              <input
                type="text"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                className="auth-input"
                placeholder="e.g. Parul University"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="auth-btn-secondary flex-1"
              >
                Back
              </button>
              <button onClick={handleNext} className="auth-btn-primary flex-1 flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Finish */}
        {step === 2 && (
          <motion.div
            key="step-2"
            className="space-y-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                {avatarPreview ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden relative">
                    <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                  </div>
                ) : (
                  <span className="text-2xl font-bold">{form.display_name.charAt(0).toUpperCase() || '?'}</span>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Looking good, {form.display_name}!</h1>
              <p className="text-white/35 text-sm">@{form.alias}</p>
              {form.bio && (
                <p className="text-white/50 text-sm italic">&ldquo;{form.bio}&rdquo;</p>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="auth-btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="auth-btn-primary flex-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Get Started'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
