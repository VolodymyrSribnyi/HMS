import {create} from 'zustand';

interface AuthState {
    accessToken : string | null;
    isAuthenticated : boolean;
    setToken: (token: string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    isAuthenticated: false,

    setToken: (token: string) => set({
        accessToken: token,
        isAuthenticated: true
    }),

    clearAuth: () => set({
        accessToken: null,
        isAuthenticated: false
    }),
}));