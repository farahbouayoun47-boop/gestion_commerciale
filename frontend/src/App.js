import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import PrivateRoute from './components/PrivateRoute';
import NotificationContainer from './components/common/NotificationContainer';

function AppContent() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement de la session...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={isAdmin ? "/admin" : "/client"} replace />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/client"
            element={
              <PrivateRoute>
                <ClientDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? (isAdmin ? "/admin" : "/client") : "/login"} replace />}
          />
        </Routes>
        <NotificationContainer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default App;
