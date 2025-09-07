import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StreamViewer from './pages/StreamViewer';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Temporary route for testing - use the actual stream ID */}
            <Route path="/" element={<Navigate to="/stream/25962097-7c2f-46a6-9ea1-5fde40dcae93" replace />} />
            <Route path="/stream/:id" element={<StreamViewer />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App
