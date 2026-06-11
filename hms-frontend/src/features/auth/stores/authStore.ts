import { create } from 'zustand';

const roleClaimTypes = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
];

interface JwtPayload {
  UserId?: string;
  nameid?: string;
  sub?: string;
  [key: string]: unknown;
}

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  roles: string[];
  userId: string | null;
  setToken: (token: string) => void;
  clearAuth: () => void;
}

const decodeBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return window.atob(padded);
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  return typeof value === 'string' ? [value] : [];
};

const parseJwt = (token: string): { roles: string[]; userId: string | null } => {
  try {
    const payload = JSON.parse(decodeBase64Url(token.split('.')[1] ?? '')) as JwtPayload;
    const roles = roleClaimTypes.flatMap((claimType) => toStringArray(payload[claimType]));
    const userId = payload.UserId ?? payload.nameid ?? payload.sub ?? null;

    return {
      roles: Array.from(new Set(roles)),
      userId: typeof userId === 'string' ? userId : null,
    };
  } catch {
    return {
      roles: [],
      userId: null,
    };
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  roles: [],
  userId: null,

  setToken: (token: string) => {
    const { roles, userId } = parseJwt(token);

    set({
      accessToken: token,
      isAuthenticated: true,
      roles,
      userId,
    });
  },

  clearAuth: () =>
    set({
      accessToken: null,
      isAuthenticated: false,
      roles: [],
      userId: null,
    }),
}));
