import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { loadProfile, saveProfile } from '../services/userData.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [profileError, setProfileError] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const profileRequest = useRef(0);

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;
    const pendingTimers = new Set();
    const applySession = async (session, event) => {
      if (!active) return;
      const requestId = ++profileRequest.current;
      const nextUser = session?.user || null;
      setUser(nextUser);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (!nextUser) {
        setProfile(null);
        setProfileError('');
        setRecoveryMode(false);
        return;
      }
      try {
        const nextProfile = await loadProfile(nextUser.id);
        if (active && requestId === profileRequest.current) {
          setProfile(nextProfile);
          setProfileError('');
        }
      } catch {
        if (active && requestId === profileRequest.current) {
          setProfileError('Não foi possível carregar o perfil. Tente atualizar a página.');
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const timer = window.setTimeout(() => {
        pendingTimers.delete(timer);
        void applySession(session, event);
      }, 0);
      pendingTimers.add(timer);
    });

    return () => {
      active = false;
      pendingTimers.forEach(window.clearTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const updateDisplayName = useCallback(async (displayName) => {
    if (!user) throw new Error('É necessário entrar novamente para atualizar o perfil.');
    const nextProfile = await saveProfile(user.id, displayName);
    setProfile(nextProfile);
    return nextProfile;
  }, [user]);
  const clearRecoveryMode = useCallback(() => setRecoveryMode(false), []);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    profileError,
    recoveryMode,
    clearRecoveryMode,
    updateDisplayName,
  }), [user, profile, loading, profileError, recoveryMode, clearRecoveryMode, updateDisplayName]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  return context;
}
