import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Onboarding from './pages/Onboarding'; // ✅ Imported the new Onboarding page
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/SettingsPage';
import LivePitchRoom from './pages/LivePitchRoom';
import PostPitchReport from './pages/PostPitchReport';
import PrePitchSetup from './pages/PrePitchSetup';
import PitchDecksManagement from './pages/PitchDecksManagement';
import PitchReplayScreen from './pages/PitchReplayScreen';
import MyPitchesArchive from './pages/MyPitchesArchive';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Routes (Wrapped in AppLayout with Sidebar) */}
              <Route element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/report" element={<PostPitchReport />} />
                <Route path="/setup" element={<PrePitchSetup />} />
                <Route path="/decks" element={<PitchDecksManagement />} />
                <Route path="/replay" element={<PitchReplayScreen />} />
                <Route path="/archive" element={<MyPitchesArchive />} />
              </Route>

              {/* Special Full-screen Routes (No Sidebar) */}
              
              {/* ✅ Added the Onboarding route here */}
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } />

              <Route path="/room" element={
                <ProtectedRoute>
                  <LivePitchRoom />
                </ProtectedRoute>
              } />
              
              {/* Safety Catch: Redirect old /live links to /room */}
              <Route path="/live" element={<Navigate to="/room" replace />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}