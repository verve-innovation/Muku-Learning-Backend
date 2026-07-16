import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Dashboard } from './components/layout/Dashboard';

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Dashboard />;
  }

  return <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
