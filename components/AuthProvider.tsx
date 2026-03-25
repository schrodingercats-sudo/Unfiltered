'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  profile: any | null;
  loading: boolean;
  needsOnboarding: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  needsOnboarding: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchingRef = useRef(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          fetchProfile(currentUser.id, currentUser.email, currentUser.user_metadata?.college);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        // Supabase connection failure — redirect to maintenance
        router.push('/maintenance');
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          fetchProfile(currentUser.id, currentUser.email, currentUser.user_metadata?.college);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string, college?: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      let currentProfile = data;

      if (!currentProfile && !error) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            alias: `User_${userId.slice(0, 5)}`,
            college: college || 'Unknown College',
            is_banned: false,
            post_count: 0,
            total_likes_received: 0,
            default_anonymous: true
          })
          .select()
          .maybeSingle();
        
        if (!createError) {
          currentProfile = newProfile;
        } else if (createError.code === '23505') {
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          currentProfile = retryData;
        }
      }

      if (currentProfile) {
        if (email === 'pratham.solanki30@gmail.com' && currentProfile.role !== 'admin') {
          const { data: updatedData, error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', userId)
            .select()
            .maybeSingle();
            
          if (!updateError && updatedData) {
            setProfile(updatedData);
            return;
          }
        }
        setProfile(currentProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const needsOnboarding = !!user && !!profile && !profile.display_name && profile.alias?.startsWith('User_');

  return (
    <AuthContext.Provider value={{ user, profile, loading, needsOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
