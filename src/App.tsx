import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext, initializeFetchWithAuth } from './contexts/AuthContext';
import './App.css';
import SignIn from './pages/SignIn/Signin';
import TwoFactorAuth from './pages/TwoFactorAuth/TwoFactorAuth';
import Home from './pages/Home/Home';
import Profile from './pages/Profile/Profile';
import { UserProvider } from './contexts/UserContext';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { signInState } = useAuthContext();

  if (signInState === 'authorized') return children;
  return <Navigate to="/signin" replace />;
}

function TwoFactorRoute({ children }: { children: JSX.Element }) {
  const { signInState } = useAuthContext();

  if (signInState === '2FA') return children;
  return <Navigate to="/signin" replace />;
}

function AppContent() {
  const { signInState } = useAuthContext();
  const authContext = useAuthContext();

  // Initialize fetch with auth context for automatic token refresh
  initializeFetchWithAuth(authContext);

  return (
    <AuthProvider>
    <UserProvider>

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
                signInState === 'authorized'
                  ? '/home'
                  : signInState === '2FA'
                  ? '/2fa'
                  : '/signin'
              }
              replace
            />
          }
        />
      </Routes>

    </UserProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
