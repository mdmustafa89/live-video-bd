const TOKEN_KEY = 'livevideo_admin_token';
const MUST_CHANGE_KEY = 'livevideo_must_change_pwd';
const USERNAME_KEY = 'livevideo_admin_username';

export interface AuthState {
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  username: string | null;
}

export class AuthService {
  private static token: string | null = null;
  private static mustChangePasswordState: boolean = false;
  private static usernameState: string | null = null;

  static init(): AuthState {
    if (typeof window !== 'undefined') {
      this.token = sessionStorage.getItem(TOKEN_KEY);
      this.mustChangePasswordState = sessionStorage.getItem(MUST_CHANGE_KEY) === 'true';
      this.usernameState = sessionStorage.getItem(USERNAME_KEY);
    }
    return {
      isAuthenticated: Boolean(this.token),
      mustChangePassword: this.mustChangePasswordState,
      username: this.usernameState,
    };
  }

  static getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = sessionStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  static isMustChangePassword(): boolean {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(MUST_CHANGE_KEY) === 'true';
    }
    return this.mustChangePasswordState;
  }

  static setAuth(token: string | null, mustChange: boolean, username?: string) {
    this.token = token;
    this.mustChangePasswordState = mustChange;
    this.usernameState = username || null;

    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
        sessionStorage.setItem(MUST_CHANGE_KEY, mustChange ? 'true' : 'false');
        if (username) sessionStorage.setItem(USERNAME_KEY, username);
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(MUST_CHANGE_KEY);
        sessionStorage.removeItem(USERNAME_KEY);
      }
    }
  }

  static async login(
    username: string,
    password: string
  ): Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.setAuth(data.token, data.mustChangePassword, data.username);
        return {
          success: true,
          mustChangePassword: data.mustChangePassword,
        };
      }
      return { success: false, error: data.error || 'Authentication failed' };
    } catch {
      return { success: false, error: 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি (Server connection failed)' };
    }
  }

  static async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Administrator authentication required.' };
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.setAuth(token, false, this.usernameState || undefined);
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to change password' };
    } catch {
      return { success: false, error: 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি (Server connection failed)' };
    }
  }

  static async checkStatus(): Promise<AuthState> {
    const token = this.getToken();
    if (!token) {
      return { isAuthenticated: false, mustChangePassword: false, username: null };
    }

    try {
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        this.setAuth(token, data.mustChangePassword, data.username);
        return {
          isAuthenticated: true,
          mustChangePassword: data.mustChangePassword,
          username: data.username,
        };
      }
    } catch {
      // ignore
    }

    this.setAuth(null, false);
    return { isAuthenticated: false, mustChangePassword: false, username: null };
  }

  static async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    this.setAuth(null, false);
  }
}
