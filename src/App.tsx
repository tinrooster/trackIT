import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import DashboardPage from './pages/DashboardPage'
import InventoryPage from './pages/InventoryPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './components/SettingsPage' // This is correct - from components
import ItemDetailsPage from './pages/ItemDetailsPage'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/LoginPage'

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // You could show a loading spinner here
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Main app layout with navigation
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <>
      {isAuthenticated && <Navigation />}
      <div className="container mx-auto p-4">
        {children}
      </div>
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="bottom-right" />
        <AppLayout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/inventory" element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            } />
            
            <Route path="/inventory/:id" element={
              <ProtectedRoute>
                <ItemDetailsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            
            {/* Catch all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  )
}