import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './stores/authStore';

// Lazy load pages for code splitting
const Landing = lazy(() => import('./pages/Landing'));
const StreamList = lazy(() => import('./pages/StreamList'));
const StreamViewer = lazy(() => import('./pages/StreamViewer'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  const { loadUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }>
              <Routes>
                {/* Landing page for non-authenticated users */}
                <Route path="/" element={
                  isAuthenticated ? <Navigate to="/streams" replace /> : <Landing />
                } />
                
                {/* Protected routes */}
                <Route path="/streams" element={
                  <ProtectedRoute>
                    <StreamList />
                  </ProtectedRoute>
                } />
                
                <Route path="/stream/:id" element={
                  <ProtectedRoute>
                    <StreamViewer />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App
