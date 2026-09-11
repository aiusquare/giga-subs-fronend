import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api } from "@/lib/apiClient";
import { tokenStorage, StoredUser } from "@/lib/tokenStorage";

export type AuthUser = StoredUser & { referral_code?: string | null }; // { id, email, full_name, role }

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    referralCode?: string,
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from stored token on mount
  useEffect(() => {
    const restore = async () => {
      const token = tokenStorage.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const u = await api.get<AuthUser>("/auth/me");
        setUser(u);
        tokenStorage.setUser(u);
      } catch {
        // Token invalid or expired — clear storage so user can re-login
        tokenStorage.clear();
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    referralCode?: string,
  ) => {
    try {
      const data = await api.post<{ token: string; user: AuthUser }>(
        "/auth/signup",
        {
          email,
          password,
          full_name: fullName,
          referral_code: referralCode?.trim() || undefined,
        },
      );
      tokenStorage.setToken(data.token);
      tokenStorage.setUser(data.user);
      setUser(data.user);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.post<{ token: string; user: AuthUser }>(
        "/auth/login",
        {
          email,
          password,
        },
      );
      tokenStorage.setToken(data.token);
      tokenStorage.setUser(data.user);
      setUser(data.user);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
