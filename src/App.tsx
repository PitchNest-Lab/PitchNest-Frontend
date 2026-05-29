import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/SettingsPage';
import LivePitchRoom from './pages/LivePitchRoom';
import PostPitchReport from './pages/PostPitchReport';
import PrePitchSetup from './pages/PrePitchSetup';
import PitchDecksManagement from './pages/PitchDecksManagement';
import PitchReplayScreen from './pages/PitchReplayScreen';
import MyPitchesArchive from './pages/MyPitchesArchive';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import DeleteAccount from './pages/legal/DeleteAccount';
import Support from './pages/legal/Support';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/support" element={<Support />} />

            {/* Protected Routes (Wrapped in AppLayout with Sidebar) */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={
                <ErrorBoundary><Dashboard /></ErrorBoundary>
              } />
              <Route path="/analytics" element={
                <ErrorBoundary><Analytics /></ErrorBoundary>
              } />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/report" element={
                <ErrorBoundary><PostPitchReport /></ErrorBoundary>
              } />
              <Route path="/setup" element={<PrePitchSetup />} />
              <Route path="/decks" element={<PitchDecksManagement />} />
              <Route path="/replay" element={
                <ErrorBoundary><PitchReplayScreen /></ErrorBoundary>
              } />
              <Route path="/archive" element={<MyPitchesArchive />} />
            </Route>

            {/* Special Full-screen Routes (No Sidebar) */}
            
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />

            {/* LivePitchRoom — SocketProvider wraps ONLY this route, not the whole app */}
            <Route path="/room" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <SocketProvider>
                    <LivePitchRoom />
                  </SocketProvider>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            
            {/* Safety Catch: Redirect old /live links to /room */}
            <Route path="/live" element={<Navigate to="/room" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}