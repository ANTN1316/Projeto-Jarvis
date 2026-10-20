import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../components.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import {
  getAuthErrorMessage, requestPasswordReset, signIn, signUp, updatePassword,
} from '../services/userData.js';

function passwordMeetsRequirements(password) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <main className="auth-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <section className="auth-card">
        <a className="auth-brand" href="/" aria-label="J.A.R.V.I.S.">
          <span className="brand-mark"><span /><i /><b /></span>
          <span className="brand-copy"><strong>J.A.R.V.I.S.</strong><small>NEURAL INTERFACE</small></span>
        </a>
        <span className="auth-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        {!supabase && (
          <div className="auth-message auth-error" role="alert">
            <Icon name="info" size={16} />
            <span>Autenticação indisponível: configure as variáveis do Supabase no arquivo <code>.env</code> e reinicie o servidor.</span>
          </div>
        )}
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
        <span className="auth-privacy">SESSÃO PROTEGIDA · DADOS ISOLADOS POR CONTA</span>
      </section>
      <span className="auth-orbit auth-orbit-one" aria-hidden="true" />
      <span className="auth-orbit auth-orbit-two" aria-hidden="true" />
    </main>
  );
}

function Message({ error, success }) {
  if (!error && !success) return null;
  return <div className={`auth-message ${error ? 'auth-error' : 'auth-success'}`} role={error ? 'alert' : 'status'}>{error || success}</div>;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const returnTo = location.state?.from;
  const destination = returnTo
    ? `${returnTo.pathname || '/'}${returnTo.search || ''}${returnTo.hash || ''}`
    : '/';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate(destination, { replace: true });
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout eyebrow="ACESSO SEGURO / 01" title="Bem-vindo de volta" description="Entre para continuar seu espaço pessoal no Jarvis.">
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="login-email">E-mail</label>
        <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
        <label htmlFor="login-password">Senha</label>
        <div className="auth-password-field">
          <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" />
          <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? 'OCULTAR' : 'MOSTRAR'}</button>
        </div>
        <Message error={error} />
        <button className="auth-submit" type="submit" disabled={busy || !supabase}>{busy ? 'VERIFICANDO…' : 'ENTRAR'} {!busy && <Icon name="arrow" size={16} />}</button>
      </form>
      <div className="auth-inline-links"><Link to="/forgot-password">Esqueci minha senha</Link><span>CONTA JARVIS</span></div>
      <div className="auth-footer">Ainda não tem uma conta? <Link to="/signup">Criar conta</Link></div>
    </AuthLayout>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const requirementsMet = passwordMeetsRequirements(password);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (displayName.trim().length < 2) return setError('Informe um nome com pelo menos 2 caracteres.');
    if (!requirementsMet) return setError('A senha deve ter ao menos 8 caracteres, uma letra e um número.');
    if (password !== confirmation) return setError('As senhas informadas não coincidem.');
    setBusy(true);
    try {
      const { session } = await signUp(displayName, email.trim(), password);
      if (session) navigate('/', { replace: true });
      else setSuccess('Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.');
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout eyebrow="NOVO PERFIL / 02" title="Criar sua conta" description="Seu espaço, suas preferências e seus dados protegidos.">
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="signup-name">Nome de exibição</label>
        <input id="signup-name" autoComplete="name" required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Como devemos chamar você?" />
        <label htmlFor="signup-email">E-mail</label>
        <input id="signup-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
        <label htmlFor="signup-password">Senha</label>
        <input id="signup-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Crie uma senha" aria-describedby="password-requirements" />
        <small id="password-requirements" className={`password-requirements${requirementsMet ? ' met' : ''}`}>Mínimo de 8 caracteres, incluindo uma letra e um número.</small>
        <label htmlFor="signup-confirmation">Confirmar senha</label>
        <input id="signup-confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Digite a senha novamente" />
        <Message error={error} success={success} />
        <button className="auth-submit" type="submit" disabled={busy || !supabase}>{busy ? 'CRIANDO CONTA…' : 'CRIAR CONTA'} {!busy && <Icon name="arrow" size={16} />}</button>
      </form>
      <div className="auth-footer">Já tem uma conta? <Link to="/login">Voltar ao login</Link></div>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout eyebrow="RECUPERAÇÃO / 03" title="Redefinir acesso" description="Informe o e-mail associado à sua conta.">
      {submitted ? (
        <Message success="Se existir uma conta associada a esse endereço, você receberá as instruções para redefinir sua senha." />
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="recovery-email">E-mail</label>
          <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
          <Message error={error} />
          <button className="auth-submit" type="submit" disabled={busy || !supabase}>{busy ? 'ENVIANDO…' : 'ENVIAR INSTRUÇÕES'} {!busy && <Icon name="arrow" size={16} />}</button>
        </form>
      )}
      <div className="auth-footer"><Link to="/login">Voltar ao login</Link></div>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const { recoveryMode, clearRecoveryMode, user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const isRecovery = recoveryMode || Boolean(user && window.location.hash.includes('type=recovery'));
  const requirementsMet = passwordMeetsRequirements(password);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!isRecovery) return setError('Este link expirou ou não é válido. Solicite uma nova redefinição.');
    if (!requirementsMet) return setError('A senha deve ter ao menos 8 caracteres, uma letra e um número.');
    if (password !== confirmation) return setError('As senhas informadas não coincidem.');
    setBusy(true);
    try {
      await updatePassword(password);
      setSuccess('Senha atualizada. Sua conta está pronta para uso.');
      clearRecoveryMode();
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout eyebrow="NOVA CREDENCIAL / 04" title="Escolha uma nova senha" description="Defina uma senha segura para proteger sua conta.">
      {!isRecovery && !success ? (
        <>
          <Message error="Este link de recuperação expirou ou é inválido. Solicite uma nova mensagem para continuar." />
          <div className="auth-footer"><Link to="/forgot-password">Solicitar novo link</Link></div>
        </>
      ) : success ? <Message success={success} /> : (
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="reset-password">Nova senha</label>
          <input id="reset-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nova senha" aria-describedby="reset-requirements" />
          <small id="reset-requirements" className={`password-requirements${requirementsMet ? ' met' : ''}`}>Mínimo de 8 caracteres, incluindo uma letra e um número.</small>
          <label htmlFor="reset-confirmation">Confirmar nova senha</label>
          <input id="reset-confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Digite novamente" />
          <Message error={error} />
          <button className="auth-submit" type="submit" disabled={busy || !supabase}>{busy ? 'SALVANDO…' : 'SALVAR NOVA SENHA'} {!busy && <Icon name="arrow" size={16} />}</button>
        </form>
      )}
      {(isRecovery || success) && <div className="auth-footer"><Link to={success ? '/' : '/login'}>Voltar {success ? 'ao Jarvis' : 'ao login'}</Link></div>}
    </AuthLayout>
  );
}
