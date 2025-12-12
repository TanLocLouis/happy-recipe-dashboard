import  { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuthContext } from './AuthContext';

// Define the shape of user information
export type UserInfo = {
  id: string;
  name: string | null;
  email: string;
  displayName?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  isVerified?: boolean;
};

// Define the context value type
interface UserContextType {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  fetchUserInfo: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const { accessToken } = useAuthContext();

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      if (!accessToken) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user-info`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUser({
            id: data.userId,
            name: data.username,
            email: data.email,
            displayName: data.displayName,
            bio: data.bio,
            profileImageUrl: data.profileImageUrl,
            isVerified: data.isVerified,
          });
          setLoading(false);
        }
      } catch (err) {
        // Optionally log or handle error
        console.error('Failed to fetch user info:', err);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser, fetchUserInfo, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
