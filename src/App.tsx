import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import SignIn from "./pages/SignIn/Signin";
import TwoFactorAuth from "./pages/TwoFactorAuth/TwoFactorAuth";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";
import React, { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import { useUserStore } from "./stores/userStore";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const signInState = useAuthStore((state) => state.signInState);

  if (signInState === "authorized") return children;
  return <Navigate to="/signin" replace />;
}

function TwoFactorRoute({ children }: { children: React.ReactNode }) {
  const signInState = useAuthStore((state) => state.signInState);

  if (signInState === "2FA") return children;
  return <Navigate to="/signin" replace />;
}

function App() {
  const signInState = useAuthStore((state) => state.signInState);

  useEffect(() => {
    if (signInState === "authorized") {
      useUserStore.getState().fetchUserInfo();
    }
  }, [signInState]);

  useEffect(() => {
    useAuthStore.getState().validateAccessToken();
  }, []);

  // // Initialize fetch with auth context for automatic token refresh
  // initializeFetchWithAuth(authContext);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route
          path="/2fa"
          element={
            <TwoFactorRoute>
              <TwoFactorAuth />
            </TwoFactorRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        {/* Own profile */}
        <Route
          path="/profile"
          element={
            // <ProtectedRoute>
            <Profile />
            // </ProtectedRoute>
          }
        />
        {/* Moderator or other user profile by userId */}
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <Navigate
              to={
                signInState === "authorized" ? "/home" : signInState === "2FA" ? "/2fa" : "/signin"
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
