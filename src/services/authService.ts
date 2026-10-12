import { UserProfile } from '../types';

const STORAGE_KEY = 'tim_sso_session';

const DEFAULT_GUEST: UserProfile = {
  id: 'guest_inventor_' + Math.floor(Math.random() * 8999 + 1000),
  name: 'Ingeniero Visitante',
  email: 'visitante@laboratorio.dev',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
  provider: 'guest',
  role: 'Explorador',
  createdAt: new Date().toISOString(),
  token: 'sso_tok_' + Math.random().toString(36).substring(2),
};

export class AuthService {
  private currentUser: UserProfile;
  private listeners: ((user: UserProfile) => void)[] = [];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch {
        this.currentUser = DEFAULT_GUEST;
      }
    } else {
      this.currentUser = DEFAULT_GUEST;
      this.saveSession(this.currentUser);
    }
  }

  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public subscribe(callback: (user: UserProfile) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentUser));
  }

  private saveSession(user: UserProfile) {
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.notify();
  }

  public async loginWithSSO(
    provider: 'google' | 'github' | 'institutional',
    userData?: { name?: string; email?: string }
  ): Promise<UserProfile> {
    // Generate secure mock JWT token format header.payload.signature
    const randPayload = btoa(
      JSON.stringify({
        sub: 'usr_' + Math.random().toString(36).substring(2, 9),
        iss: provider === 'google' ? 'https://accounts.google.com' : provider === 'github' ? 'https://github.com' : 'https://sso.educacion.org',
        exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      })
    );
    const token = `sso_jwt.${randPayload}.${Math.random().toString(36).substring(2, 12)}`;

    let avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';
    let defaultName = 'Dr. Juan Arquímedes';
    let defaultEmail = 'juan.arquimedes@gmail.com';
    let role: UserProfile['role'] = 'Ingeniero Mecánico';

    if (provider === 'github') {
      avatar = 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80';
      defaultName = 'Ing. Nikola Tesla';
      defaultEmail = 'nikola.tesla@github.com';
      role = 'Ingeniero Mecánico';
    } else if (provider === 'institutional') {
      avatar = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80';
      defaultName = 'Dra. Ada Lovelace';
      defaultEmail = 'ada.lovelace@instituto-cognitivo.edu';
      role = 'Investigador Cognitivo';
    }

    const newUser: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: userData?.name || defaultName,
      email: userData?.email || defaultEmail,
      avatarUrl: avatar,
      provider,
      role,
      createdAt: new Date().toISOString(),
      token,
    };

    this.saveSession(newUser);
    return newUser;
  }

  public logout(): void {
    this.saveSession(DEFAULT_GUEST);
  }
}

export const authService = new AuthService();
