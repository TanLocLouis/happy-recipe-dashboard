import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type FC,
  type ReactNode,
} from "react";

const AuthContext = createContext<
  | {
      accessToken: string;
      setAccessToken: (accessToken: string) => void;

      refreshToken: string;
      setRefreshToken: (refreshToken: string) => void;

      validateAccessToken: () => Promise<boolean>;
      requestNewAccessToken: () => Promise<string>;

      twoFactorToken: string;
      validateTwoFactorToken: () => Promise<boolean>;
      verify2FA: (code: string) => Promise<boolean>;

      signInState: "unauthorized" | "2FA" | "authorized";
      role: "USER" | "MODERATOR" | "ADMIN";

      signIn: (email: string, password: string) => Promise<void>;
      signUp: (
        userName: string,
        firstName: string,
        lastName: string,
        email: string,
        password: string
      ) => Promise<boolean>;

      signOut: () => void;
    }
  | undefined
>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  //States
  const [signInState, setSignInState] = useState<
    "unauthorized" | "2FA" | "authorized"
  >("unauthorized");

  //Tokens
  const [accessToken, setAccessToken] = useState<string>("");
  const [refreshToken, setRefreshToken] = useState<string>(() => {
    const refreshTok = localStorage.getItem("refresh-token");
    if (!refreshTok) return "";
    return refreshTok;
  });
  const [twoFactorToken, settwoFactorToken] = useState<string>(""); //2FA temporary token

  // Role
  // DEBUG
  const [role, setRole] = useState<"USER" | "MODERATOR" | "ADMIN">("MODERATOR");

  // DEBUG
  useEffect(() => {
    if (refreshToken && signInState === "unauthorized") {
      requestNewAccessToken();
      console.log(role);
    }
  }, []);

  /**
   * Helper function that clear all access token and refresh token
   */
  const clearToken = useCallback(() => {
    setSignInState("unauthorized");

    setAccessToken("");
    setRefreshToken("");

    localStorage.removeItem("refresh-token");

    return false;
  }, []);

  /**
   * Helper function to return an error
   */
  const authError = useCallback((status: number) => {
    const error: any = new Error("Failed to fetch");
    error.status = status;
    return error;
  }, []);

  /**
   * Request Backend for a new access token
   * Require an existing refresh token
   *
   * @returns Promise<boolean>
   */
  const requestNewAccessToken = useCallback(async () => {
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

      if (!res.ok) throw authError(res.status);

      const data = await res.json();

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setSignInState("authorized");

      return data.accessToken;
    } catch (e) {
      return clearToken();
    }
  }, [refreshToken]);

  /**
   * Confirm the validity of the access token
   *
   * @returns Promise<boolean>
   */
  const validateAccessToken = useCallback(async () => {
    try {
      // if (!accessToken) throw new Error("No access token found");

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

      if (!res.ok) throw authError(res.status);

      setSignInState("authorized");

      return true;
    } catch (e: any) {
      if (e.status === 401) {
        return requestNewAccessToken();
      } else {
        return clearToken();
      }
    }
  }, [accessToken, requestNewAccessToken]);

  /**
   * Confirm the validity of the temp token used for 2FA
   *
   * @returns Promise<boolean>
   */
  const validateTwoFactorToken = useCallback(async () => {
    try {
      if (!twoFactorToken) return false;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/validate/2fa`,
        {
          method: "GET",
          headers: {
            authorization: `Bearer ${twoFactorToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!res.ok) throw authError(res.status);

      const data = await res.json();
      setRole(data.user.role);

      return true;
    } catch (e) {
      setSignInState("unauthorized");
      settwoFactorToken("");
      return false;
    }
  }, [twoFactorToken]);

  /**
   * Send the 2FA code along side the temp token to the backend
   * Is used when 2FA is required when sign in
   *
   * @returns Promise<boolean>
   */
  const verify2FA = useCallback(
    async (code: string) => {
      try {
        if (!twoFactorToken) throw new Error("temp Token does not exist");

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/validate/2fa`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${twoFactorToken}`,
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({ code: code }),
          }
        );
        if (!res.ok) throw authError(res.status);

        const data = await res.json();
        setAccessToken(data.accessToken);

        setRefreshToken(data.refreshToken);
        localStorage.setItem("refresh-token", data.refreshToken);

        setSignInState("authorized");
        settwoFactorToken("");

        return true;
      } catch (e) {
        return false;
      }
    },
    [twoFactorToken]
  );

  /**
   * Send the email and password to the backend for sign in
   *
   * @param email - a valid email string
   * @param password - password with at least 8 characters
   */
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email: email, password: password }),
      });

      if (!res.ok) throw authError(res.status);

      const data = await res.json();

      if (data.status === "require2FA") {
        settwoFactorToken(data.twoFactorToken);
        setSignInState("2FA");
      } else {
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        localStorage.setItem("refresh-token", data.refreshToken);

        setSignInState("authorized");
      }
    } catch (error: any) {
      if (error.status === 401) {
        alert("Your username or password is incorrect");
      } else {
        alert("500 Internal Server Error");
      }
    }
  }, []);

  /**
   * Send the sign up info to the back end
   *
   * @param userName - the username of the user
   * @param firstName - first name
   * @param lastName - last name
   * @param email - a valid email string
   * @param password - password with at least 8 characters
   *
   * @returns Promise<boolean>
   */
  const signUp = useCallback(
    async (
      userName: string,
      firstName: string,
      lastName: string,
      email: string,
      password: string
    ) => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            userName: userName,
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
          }),
        });

        if (!res.ok) return false;

        const data = await res.json();

        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setSignInState("authorized");

        return true;
      } catch (e) {
        return false;
      }
    },
    [accessToken, refreshToken]
  );

  /**
   * Log the user out of their account
   * Remove all tokens
   */
  const signOut = useCallback(() => {
    clearToken();
    settwoFactorToken("");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        twoFactorToken,
        validateTwoFactorToken,
        accessToken,
        validateAccessToken,
        requestNewAccessToken,
        setAccessToken,
        refreshToken,
        setRefreshToken,
        signInState,
        signIn,
        verify2FA,
        role,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

//Custom Hook
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
};
