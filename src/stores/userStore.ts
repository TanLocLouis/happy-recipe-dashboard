import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useAuthStore } from "./authStore";

interface userInformation {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  bio: string;
  profileImageUrl: string;
  isVerified: boolean;
}

interface UserContextType {
  userInformation: userInformation;
  fetchUserInfo: () => Promise<void>;
}

export const useUserStore = create<UserContextType>()(
  subscribeWithSelector((set) => ({
    userInformation: {
      userId: "",
      username: "",
      displayName: "",
      email: "",
      bio: "",
      profileImageUrl: "",
      isVerified: false,
    },

    fetchUserInfo: async () => {
      const { signInState, accessToken, requestNewAccessToken } = useAuthStore.getState();

      try {
        if (signInState === "authorized" && accessToken) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user-info`, {
            method: "GET",
            headers: {
              authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          });

          //If access token is invalid or expired request a new one
          if (res.status === 401) {
            await requestNewAccessToken();
            return;
          }

          const data = await res.json();

          //Set user information state
          set({
            userInformation: {
              userId: data.userId,
              username: data.username,
              displayName: data.displayName,
              email: data.email,
              bio: data.bio,
              profileImageUrl: data.profileImageUrl,
              isVerified: data.isVerified,
            },
          });
        }
      } catch (e) {
        console.error("Failed to fetch user info:", e);
      }
    },
  }))
);
