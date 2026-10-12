import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  Key,
  Check,
  User,
  LogOut,
  Building,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';
import { soundEngine } from '../services/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUserChange: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserChange,
}) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSSO = async (provider: 'google' | 'github' | 'institutional') => {
    soundEngine.playClick();
    setLoadingProvider(provider);
    try {
      // Simulate OAuth SSO handshake & token issuance
      await new Promise((r) => setTimeout(r, 600));
      const updatedUser = await authService.loginWithSSO(provider);
      onUserChange(updatedUser);
      onClose();
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleLogout = () => {
    soundEngine.playClick();
    authService.logout();
    onUserChange(authService.getCurrentUser());
    onClose();
  };

  return (
    <div
      id="sso-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold font-['Outfit'] tracking-tight">
                Autenticación Segura SSO
              </h2>
              <p className="text-xs text-slate-400">
                Sistema de Inicio de Sesión Único (Single Sign-On)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Current Active Session Status */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-sky-400"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  {user.name}
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                    {user.provider}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                  {user.email}
                </div>
                <div className="text-[10px] text-indigo-400 font-medium mt-0.5">
                  Rol: {user.role}
                </div>
              </div>
            </div>

            {user.provider !== 'guest' && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition cursor-pointer border border-slate-700/60"
                title="Cerrar sesión SSO"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* SSO Providers */}
          <div className="space-y-2.5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
              Selecciona tu proveedor de identidad:
            </span>

            {/* Google SSO */}
            <button
              id="btn-sso-google"
              onClick={() => handleSSO('google')}
              disabled={loadingProvider !== null}
              className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 flex items-center justify-between transition cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white">Continuar con Google SSO</div>
                  <div className="text-[10px] text-slate-400">OAuth 2.0 / OpenID Connect</div>
                </div>
              </div>
              {user.provider === 'google' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <ExternalLink className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* GitHub SSO */}
            <button
              id="btn-sso-github"
              onClick={() => handleSSO('github')}
              disabled={loadingProvider !== null}
              className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 flex items-center justify-between transition cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white">Continuar con GitHub SSO</div>
                  <div className="text-[10px] text-slate-400">Perfil de Ingeniero y Desarrollador</div>
                </div>
              </div>
              {user.provider === 'github' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <ExternalLink className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Institutional / Academic SSO */}
            <button
              id="btn-sso-edu"
              onClick={() => handleSSO('institutional')}
              disabled={loadingProvider !== null}
              className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 flex items-center justify-between transition cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white">SSO Institucional / Académico</div>
                  <div className="text-[10px] text-slate-400">Federación SAML 2.0 / EduID</div>
                </div>
              </div>
              {user.provider === 'institutional' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <ExternalLink className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>

          {/* Token Security Proof */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Token Criptográfico de Sesión</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate">{user.token}</div>
            <div className="text-[10px] text-emerald-400/80">
              Estado: Válido por 7 días • Cifrado AES-256
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
