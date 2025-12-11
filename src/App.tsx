import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import './App.css';
import SignIn from './pages/SignIn/Signin';
import TwoFactorAuth from './pages/TwoFactorAuth/TwoFactorAuth';
import Home from './pages/Home/Home';

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

  return (
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
