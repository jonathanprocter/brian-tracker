import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

// Generate a unique session ID
const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create session ID from sessionStorage
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('activity_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('activity_session_id', sessionId);
    sessionStorage.setItem('session_start_time', Date.now().toString());
  }
  return sessionId;
};

export function useActivityTracker() {
  const { isAuthenticated } = useAuth();
  const logEvent = trpc.activity.logEvent.useMutation();
  const hasLoggedSession = useRef(false);

  // Log page view on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const sessionId = getSessionId();
    
    // Log session start only once per session
    if (!hasLoggedSession.current) {
      hasLoggedSession.current = true;
      logEvent.mutate({
        actionType: 'session_start',
        pagePath: window.location.pathname,
        sessionId,
      });
    }

    // Log page view
    logEvent.mutate({
      actionType: 'page_view',
      pagePath: window.location.pathname,
      sessionId,
    });

    // Log session end on page unload
    const handleUnload = () => {
      const startTime = sessionStorage.getItem('session_start_time');
      const duration = startTime ? Math.round((Date.now() - parseInt(startTime)) / 1000) : 0;
      
      // Use sendBeacon for reliable unload tracking
      const data = JSON.stringify({
        actionType: 'session_end',
        sessionId,
        sessionDuration: duration,
      });
      
      // Create Blob with correct content-type for tRPC
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon('/api/trpc/activity.logEvent', blob);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [isAuthenticated]);

  // Return function to log specific events
  const trackEvent = (
    actionType: 'login' | 'logout' | 'page_view' | 'task_started' | 'task_completed' | 
                'settings_viewed' | 'stats_viewed' | 'achievements_viewed',
    metadata?: Record<string, unknown>
  ) => {
    if (!isAuthenticated) return;
    
    logEvent.mutate({
      actionType,
      pagePath: window.location.pathname,
      sessionId: getSessionId(),
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
  };

  return { trackEvent };
}
