import { ACCENTS, DEFAULT_PREFERENCES } from '../data.js';
import { supabase } from '../lib/supabase.js';

function requireClient() {
  if (!supabase) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para continuar.');
  }
  return supabase;
}

export function getAuthErrorMessage(error) {
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('user already registered')) return 'Este e-mail já possui uma conta.';
  if (message.includes('password should be at least')) return 'A senha não atende aos requisitos mínimos.';
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (message.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  if (message.includes('fetch') || message.includes('network')) return 'Não foi possível conectar ao serviço. Verifique sua conexão.';
  return 'Não foi possível concluir a solicitação. Verifique os dados e tente novamente.';
}

export async function signIn(email, password) {
  const { data, error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(displayName, email, password) {
  const { data, error } = await requireClient().auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName.trim() },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email) {
  const { error } = await requireClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password) {
  const { error } = await requireClient().auth.updateUser({ password });
  if (error) throw error;
}

export async function loadProfile(userId) {
  const client = requireClient();
  const { data, error } = await client
    .from('profiles')
    .select('id, display_name, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(userId, displayName) {
  const { data, error } = await requireClient()
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('id', userId)
    .select('id, display_name, avatar_url, created_at, updated_at')
    .single();
  if (error) throw error;
  return data;
}

function toDatabasePreferences(preferences, userId) {
  return {
    user_id: userId,
    theme: 'dark',
    accent_color: preferences.accent,
    language: 'pt-BR',
    voice_enabled: false,
    sound_enabled: false,
    reduced_motion: preferences.reducedMotion,
    intensity: preferences.intensity,
    particles: preferences.particles,
    density: preferences.density,
  };
}

function fromDatabasePreferences(row) {
  if (!row) return DEFAULT_PREFERENCES;
  return {
    ...DEFAULT_PREFERENCES,
    accent: Object.hasOwn(ACCENTS, row.accent_color) ? row.accent_color : DEFAULT_PREFERENCES.accent,
    intensity: Number.isFinite(row.intensity) ? Math.min(100, Math.max(0, row.intensity)) : DEFAULT_PREFERENCES.intensity,
    particles: typeof row.particles === 'boolean' ? row.particles : DEFAULT_PREFERENCES.particles,
    reducedMotion: typeof row.reduced_motion === 'boolean' ? row.reduced_motion : DEFAULT_PREFERENCES.reducedMotion,
    density: row.density === 'compact' ? 'compact' : DEFAULT_PREFERENCES.density,
  };
}

export async function loadPreferences(userId) {
  const client = requireClient();
  const { data, error } = await client
    .from('user_preferences')
    .select('accent_color, intensity, particles, reduced_motion, density')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return fromDatabasePreferences(data);

  const { error: insertError } = await client
    .from('user_preferences')
    .insert(toDatabasePreferences(DEFAULT_PREFERENCES, userId));
  if (insertError && insertError.code !== '23505') throw insertError;

  if (insertError) {
    const { data: latest, error: reloadError } = await client
      .from('user_preferences')
      .select('accent_color, intensity, particles, reduced_motion, density')
      .eq('user_id', userId)
      .single();
    if (reloadError) throw reloadError;
    return fromDatabasePreferences(latest);
  }
  return DEFAULT_PREFERENCES;
}

export async function savePreferences(userId, preferences) {
  const client = requireClient();
  const { user_id: ownerId, ...values } = toDatabasePreferences(preferences, userId);
  const update = async () => {
    const { data, error } = await client
      .from('user_preferences')
      .update(values)
      .eq('user_id', ownerId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  };

  if (await update()) return preferences;

  const { error: insertError } = await client
    .from('user_preferences')
    .insert({ user_id: ownerId, ...values });
  if (insertError?.code === '23505' && await update()) return preferences;
  if (insertError) throw insertError;
  return preferences;
}
