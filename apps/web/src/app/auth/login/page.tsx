'use client'

import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'email' | 'cpf'>('email')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function formatCpf(value: string) {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const identifier = tab === 'email' ? email : cpf
    startTransition(async () => {
      const res = await signIn('credentials', {
        email: identifier,
        password,
        redirect: false,
      })
      if (res?.error === 'CPF_NAO_VALIDADO') {
        setError('Seu cadastro aguarda validação do CPF pelo RH.')
      } else if (res?.error) {
        setError('E-mail/CPF ou senha incorretos.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --navy: #06224A; --navy-mid: #0D3570; --accent: #3B7BF6; --gold: #E8A020;
          --text: #1a1a2e; --text2: #4a5568; --text3: #9aa5b4;
          --border: #e2e8f0; --border2: #cbd5e0;
          --surface: #f7f8fc; --surface2: #edf0f5; --white: #ffffff;
          --serif: 'Instrument Serif', serif; --sans: 'DM Sans', sans-serif;
          --red: #e53e3e; --r: 12px;
        }
        html, body { height: 100%; font-family: var(--sans); -webkit-font-smoothing: antialiased; }
        .login-wrap { display: flex; min-height: 100vh; }
        .login-left { flex: 1.1; position: relative; display: flex; flex-direction: column; justify-content: space-between; padding: 40px 48px; overflow: hidden; }
        .login-bg { position: absolute; inset: 0; background: url('/bg-login.jpg') center/cover no-repeat; }
        .login-bg-overlay { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(6,34,74,.82) 0%, rgba(6,34,74,.5) 55%, rgba(6,34,74,.2) 100%); }
        .ll-top, .ll-mid, .ll-bottom { position: relative; z-index: 1; }
        .ll-logo { display: flex; align-items: center; gap: 10px; }
        .ll-heading { font-family: var(--serif); font-size: clamp(38px, 4vw, 56px); font-weight: 400; color: #fff; line-height: 1.08; letter-spacing: -.5px; margin-bottom: 14px; }
        .ll-heading em { font-style: italic; color: rgba(255,255,255,.65); }
        .ll-sub { font-size: 14.5px; color: rgba(255,255,255,.55); line-height: 1.65; max-width: 320px; }
        .ll-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); backdrop-filter: blur(8px); border-radius: 100px; padding: 6px 14px 6px 10px; margin-bottom: 12px; }
        .ll-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 6px var(--gold); }
        .ll-badge span { font-size: 12px; font-weight: 500; color: rgba(255,255,255,.85); letter-spacing: .3px; }
        .ll-stats { display: flex; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 14px; overflow: hidden; margin-top: 36px; width: fit-content; }
        .ll-stat { padding: 14px 26px; border-right: 1px solid rgba(255,255,255,.1); text-align: center; }
        .ll-stat:last-child { border-right: none; }
        .ll-stat-val { font-family: var(--serif); font-size: 24px; color: #fff; display: block; letter-spacing: -1px; }
        .ll-stat-label { font-size: 10.5px; color: rgba(255,255,255,.38); letter-spacing: .5px; text-transform: uppercase; margin-top: 2px; display: block; }
        .ll-footer { font-size: 11px; color: rgba(255,255,255,.28); letter-spacing: .3px; }
        .login-right { width: 440px; min-width: 440px; background: var(--white); display: flex; align-items: center; justify-content: center; padding: 48px 52px; }
        .lf-inner { width: 100%; }
        .lf-title { font-family: var(--serif); font-size: 28px; font-weight: 400; color: var(--text); margin-bottom: 4px; letter-spacing: -.3px; }
        .lf-sub { font-size: 13px; color: var(--text3); margin-bottom: 26px; }
        .lf-tabs { display: flex; background: var(--surface2); border-radius: 9px; padding: 3px; margin-bottom: 22px; gap: 2px; }
        .lf-tab { flex: 1; padding: 8px; border-radius: 7px; border: none; background: transparent; font-family: var(--sans); font-size: 13px; font-weight: 500; color: var(--text3); cursor: pointer; transition: all .2s; }
        .lf-tab.active { background: var(--white); color: var(--text); box-shadow: 0 1px 4px rgba(6,34,74,.1); }
        .inp-wrap { position: relative; margin-bottom: 11px; }
        .inp-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; stroke: var(--text3); fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
        .lf-inp { width: 100%; padding: 11px 13px 11px 38px; border: 1.5px solid var(--border); border-radius: var(--r); background: var(--surface); font-family: var(--sans); font-size: 13.5px; color: var(--text); outline: none; transition: all .2s; }
        .lf-inp:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,123,246,.11); background: #fff; }
        .lf-inp.pr { padding-right: 42px; }
        .eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; padding: 2px; cursor: pointer; color: var(--text3); display: flex; align-items: center; }
        .eye-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .lf-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; margin-top: 2px; }
        .lf-check { display: flex; align-items: center; gap: 7px; font-size: 13px; color: var(--text2); cursor: pointer; }
        .lf-check input { accent-color: var(--accent); width: 14px; height: 14px; }
        .lf-forgot { font-size: 13px; color: var(--accent); text-decoration: none; font-weight: 500; }
        .lf-forgot:hover { text-decoration: underline; }
        .btn-primary { width: 100%; padding: 12px; background: var(--navy); color: #fff; font-family: var(--sans); font-size: 13.5px; font-weight: 600; border: none; border-radius: var(--r); cursor: pointer; transition: all .2s; letter-spacing: .2px; }
        .btn-primary:hover:not(:disabled) { background: var(--navy-mid); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(6,34,74,.28); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .spinner { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle; margin-right: 6px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lf-divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; font-size: 12px; color: var(--text3); }
        .lf-divider::before, .lf-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .btn-sso { width: 100%; padding: 11px; background: #fff; border: 1.5px solid var(--border); border-radius: var(--r); font-family: var(--sans); font-size: 13px; font-weight: 500; color: var(--text2); cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .btn-sso:hover { border-color: var(--border2); background: var(--surface); }
        .btn-sso svg { width: 18px; height: 18px; flex-shrink: 0; }
        .lf-error { background: #fff5f5; border: 1px solid #fed7d7; border-radius: 9px; padding: 10px 14px; font-size: 13px; color: var(--red); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .lf-error svg { flex-shrink: 0; width: 15px; height: 15px; stroke: var(--red); fill: none; stroke-width: 2; stroke-linecap: round; }
        .lf-footer-note { margin-top: 24px; font-size: 11.5px; color: var(--text3); text-align: center; line-height: 1.6; }
        .lf-demo-compact { margin: 24px auto 0; width: fit-content; min-width: 280px; display: flex; flex-direction: column; background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 10px; gap: 8px; }
        .lf-demo-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
        .lf-demo-badge { background: var(--navy); color: #fff; font-size: 9px; font-weight: 800; padding: 3px 6px; border-radius: 5px; letter-spacing: 0.5px; }
        .lf-demo-info { display: flex; flex-direction: column; gap: 4px; }
        .lf-demo-row { display: flex; align-items: center; gap: 10px; background: #fff; padding: 5px 10px; border-radius: 7px; border: 1px solid var(--border); }
        .lf-demo-role { font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; min-width: 20px; }
        .lf-demo-email { font-family: monospace; font-size: 10px; color: var(--text2); }
        .lf-demo-hint { font-size: 10px; color: var(--text3); }
        .lf-demo-hint strong { color: var(--accent); }
        @media (max-width: 900px) { .login-left { display: none; } .login-right { width: 100%; min-width: unset; } }
      `}</style>

      <div className="login-wrap">
        <div className="login-left">
          <div className="login-bg" />
          <div className="login-bg-overlay" />
          <div className="ll-top">
            <div className="ll-logo">
              <img src="/logo.png" alt="SISVAC Oficial" style={{ maxHeight: '64px', maxWidth: '100%', objectFit: 'contain' }} />
            </div>
          </div>
          <div className="ll-mid">
            <div className="ll-badge">
              <div className="ll-badge-dot" />
              <span>Sistema Oficial — FCECON</span>
            </div>
            <h1 className="ll-heading">Gestão de férias<br /><em>sem burocracia</em></h1>
            <p className="ll-sub">Controle de férias e licenças de servidores públicos com conformidade à Lei 1.762/1986.</p>
            <div className="ll-stats">
              <div className="ll-stat"><span className="ll-stat-val">30d</span><span className="ll-stat-label">Por exercício</span></div>
              <div className="ll-stat"><span className="ll-stat-val">3×</span><span className="ll-stat-label">Fracionamentos</span></div>
              <div className="ll-stat"><span className="ll-stat-val">5a</span><span className="ll-stat-label">Lic. especial</span></div>
            </div>
          </div>
          <div className="ll-bottom">
            <p className="ll-footer">© 2025 FCECON · SisVac — Desenvolvido por Isaque Vergueiro. Todos os direitos reservados.</p>
          </div>
        </div>

        <div className="login-right">
          <div className="lf-inner">
            <h2 className="lf-title">Entrar no sistema</h2>
            <p className="lf-sub">Acesse com suas credenciais institucionais</p>

            <div className="lf-tabs">
              <button type="button" className={`lf-tab${tab === 'email' ? ' active' : ''}`} onClick={() => { setTab('email'); setError('') }}>E-mail</button>
              <button type="button" className={`lf-tab${tab === 'cpf' ? ' active' : ''}`} onClick={() => { setTab('cpf'); setError('') }}>CPF</button>
            </div>

            <form onSubmit={handleSubmit}>
              {tab === 'email' ? (
                <div className="inp-wrap">
                  <svg className="inp-icon" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8l10 6 10-6" /></svg>
                  <input className="lf-inp" type="email" placeholder="servidor@fcecon.am.gov.br" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                </div>
              ) : (
                <div className="inp-wrap">
                  <svg className="inp-icon" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="12" y2="15" /></svg>
                  <input className="lf-inp" type="text" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} required autoComplete="off" inputMode="numeric" />
                </div>
              )}

              <div className="inp-wrap">
                <svg className="inp-icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                <input className="lf-inp pr" type={showPass ? 'text' : 'password'} placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                  <svg viewBox="0 0 24 24">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                    }
                  </svg>
                </button>
              </div>

              <div className="lf-row">
                <label className="lf-check">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  Lembrar acesso
                </label>
                <a href="#" className="lf-forgot">Esqueci a senha</a>
              </div>

              {error && (
                <div className="lf-error">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={isPending}>
                {isPending && <span className="spinner" />}
                {isPending ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            <div className="lf-divider">ou continue com</div>

            <button type="button" className="btn-sso" onClick={handleGoogle}>
              <svg viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Entrar com Google Workspace
            </button>

            <p className="lf-footer-note">Acesso restrito a servidores da FCECON.<br />Problemas? Contate o setor de TI.</p>

            <div className="lf-demo-compact">
              <div className="lf-demo-top">
                <div className="lf-demo-badge">Contas de Demonstração</div>
                <div className="lf-demo-hint">Senha: <strong>demo123</strong></div>
              </div>
              <div className="lf-demo-info">
                <div className="lf-demo-row">
                  <span className="lf-demo-role">RH:</span>
                  <span className="lf-demo-email">rh@sisvac.com</span>
                </div>
                <div className="lf-demo-row">
                  <span className="lf-demo-role">SV:</span>
                  <span className="lf-demo-email">servidor@sisvac.com</span>
                </div>
              </div>
            </div>

            <p style={{ marginTop: 20, fontSize: '10px', color: '#b0b8c4', textAlign: 'center', letterSpacing: '.2px' }}>© {new Date().getFullYear()} Isaque Vergueiro · Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    </>
  )
}
