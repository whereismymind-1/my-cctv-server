import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/react';

export const initSentry = () => {
  // Only initialize Sentry in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing({
          // Set 'tracePropagationTargets' to control what URLs are traced
          tracePropagationTargets: [
            'localhost',
            /^https:\/\/yourserver\.io\/api/,
          ],
          // Capture interactions
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            // @ts-ignore
            window.ReactRouterDOM?.useLocation,
            // @ts-ignore
            window.ReactRouterDOM?.useNavigationType,
            // @ts-ignore
            window.ReactRouterDOM?.createRoutesFromChildren,
            // @ts-ignore
            window.ReactRouterDOM?.matchRoutes
          ),
        }),
        new Sentry.Replay({
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
          const error = hint.originalException;
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