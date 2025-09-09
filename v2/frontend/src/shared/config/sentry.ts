import * as Sentry from '@sentry/react';
import * as React from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

export const initSentry = () => {
  // Only initialize Sentry in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        // Use SDK v10 integrations API
        Sentry.reactRouterV7BrowserTracingIntegration({
          // Configure which URLs to trace
          tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
          // Hook into React Router v7
          useEffect: React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),
        Sentry.replayIntegration({
          // Capture 10% of all sessions
          sessionSampleRate: 0.1,
          // Capture 100% of sessions with an error
          errorSampleRate: 1.0,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
      environment: import.meta.env.MODE,
      // Additional options
      beforeSend(event, hint) {
        // Filter out specific errors if needed
        if (event.exception) {
          const error = (hint as any)?.originalException as { message?: string } | undefined;
          // Don't send network errors in development
          if (!import.meta.env.PROD && error?.message?.includes('Network')) {
            return null;
          }
        }
        return event;
      },
    });
  }
};

// Export Sentry for use in other parts of the app
export { Sentry };
