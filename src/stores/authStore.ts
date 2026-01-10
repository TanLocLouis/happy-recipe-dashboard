import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthError } from "../errors/AuthError";

const normalizeRole = (incomingRole?: string): "USER" | "MODERATOR" | "ADMIN" => {
  const upperRole = incomingRole?.toUpperCase();
  if (upperRole === "ADMIN" || upperRole === "MODERATOR" || upperRole === "USER") return upperRole;
  return "USER";
};

interface authStoreType {
  role: "USER" | "MODERATOR" | "ADMIN";
  setRole: (role: "USER" | "MODERATOR" | "ADMIN") => void;
  accessToken: string;
  setAccessToken: (accessToken: string) => void;

  refreshToken: string;
  setRefreshToken: (refreshToken: string) => void;

  setUpToken: (accessToken: string, refreshToken: string) => void;
  clearToken: () => void;
  throwAuthError: (status: number) => AuthError;

  validateAccessToken: () => Promise<boolean>;
  requestNewAccessToken: () => Promise<boolean>;

  twoFactorToken: string;
  setTwoFactorToken: (twoFactorToken: string) => void;
  validateTwoFactorToken: () => Promise<boolean>;
  verify2FA: (code: string) => Promise<boolean>;

  signInState: "unauthorized" | "2FA" | "authorized";
  setSignInState: (state: "unauthorized" | "2FA" | "authorized") => void;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<boolean>;

  signOut: () => void;
}

export const useAuthStore = create<authStoreType>()(
  persist(
    (set, get) => ({
      role: "USER",
      setRole: (role: "USER" | "MODERATOR" | "ADMIN") => set({ role }),
      accessToken: "",
      refreshToken: "",
      twoFactorToken: "",
      signInState: "unauthorized",

      setAccessToken: (accessToken: string) => set({ accessToken }),
      setRefreshToken: (refreshToken: string) => set({ refreshToken }),
      setTwoFactorToken: (twoFactorToken: string) => set({ twoFactorToken }),
      setSignInState: (state: "unauthorized" | "2FA" | "authorized") => set({ signInState: state }),

      setUpToken: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken, signInState: "authorized" });
      },

      clearToken: () => {
        set({
          accessToken: "",
          refreshToken: "",
          twoFactorToken: "",
          signInState: "unauthorized",
          role: "USER",
        });
      },

      throwAuthError: (status: number) => {
        const error: any = new AuthError(status, "Authentication Error");
        return error;
      },

      validateAccessToken: async () => {
        const accessToken = get().accessToken;
        try {
          if (!get().accessToken) throw new Error("No access token found");

          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/auth/validate/access-token`,
            {
              method: "GET",
              headers: {
                authorization: `Bearer ${accessToken}`,
                "ngrok-skip-browser-warning": "true",
              },
            }
          );

          if (!res.ok) throw get().throwAuthError(res.status);
          get().setSignInState("authorized");

          return true;
        } catch (e: any) {
          if (e.status === 401) {
            return get().requestNewAccessToken();
          } else {
            get().clearToken();
            return false;
          }
        }
      },

      requestNewAccessToken: async () => {
        const refreshToken = get().refreshToken;
        try {
          if (!refreshToken) throw new Error("No refresh token found");

          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/auth/validate/refresh-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${refreshToken}`,
                "ngrok-skip-browser-warning": "true",
              },
            }
          );

          if (!res.ok) throw get().throwAuthError(res.status);

          const data = await res.json();
          get().setUpToken(data.accessToken, data.refreshToken);

          return true;
        } catch (e) {
          get().clearToken();
          return false;
        }
      },

      validateTwoFactorToken: async () => {
        if (!get().twoFactorToken) return false;

        try {
          const twoFactorToken = get().twoFactorToken;
          if (!twoFactorToken) return false;

          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/validate/2fa`, {
            method: "GET",
            headers: {
              authorization: `Bearer ${twoFactorToken}`,
              "ngrok-skip-browser-warning": "true",
            },
          });

          if (!res.ok) throw get().throwAuthError(res.status);

          return true;
        } catch (e) {
          get().setSignInState("unauthorized");
          get().setTwoFactorToken("");
          return false;
        }
      },

      verify2FA: async (code: string) => {
        try {
          const twoFactorToken = get().twoFactorToken;
          if (!twoFactorToken) throw new Error("temp Token does not exist");

          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/validate/2fa`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${twoFactorToken}`,
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({ code: code }),
          });
          if (!res.ok) throw get().throwAuthError(res.status);

          const data = await res.json();

          set({ role: normalizeRole(data.user.role) });
          get().setUpToken(data.accessToken, data.refreshToken);
          get().setTwoFactorToken("");

          return true;
        } catch (e) {
          return false;
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signin`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({ email: email, password: password }),
          });

          if (!res.ok) throw get().throwAuthError(res.status);

          const data = await res.json();

          if (data.status === "require2FA") {
            get().setTwoFactorToken(data.twoFactorToken);
            get().setSignInState("2FA");
          } else {
            get().setUpToken(data.accessToken, data.refreshToken);
          }
        } catch (error: any) {
          if (error.status === 401) {
            alert("Your username or password is incorrect");
          } else {
            alert("500 Internal Server Error");
          }
        }
      },

      signUp: async (firstName: string, lastName: string, email: string, password: string) => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              firstName: firstName,
              lastName: lastName,
              email: email,
              password: password,
            }),
          });

          if (!res.ok) return false;

          const data = await res.json();
          get().setUpToken(data.accessToken, data.refreshToken);

          return true;
        } catch (e) {
          return false;
        }
      },

      signOut: () => {
        get().clearToken();
      },
    }),
    {
      name: "auth-storage", // name of the item in the storage (must be unique)
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        twoFactorToken: state.twoFactorToken,
        role: state.role,
      }),
    }
  )
);
