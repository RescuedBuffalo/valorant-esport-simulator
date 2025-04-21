import { useEffect, FC } from 'react';
import { useLocation } from 'react-router-dom';
import { MetricsService } from '../services/metrics';

/**
 * Component to track page views and timings
 * This should be rendered at the top level of the application
 */
const MetricsTracker: FC = () => {
  const location = useLocation();
  const metrics = MetricsService.getInstance();

  // Track page views and timing
  useEffect(() => {
    const path = location.pathname;
    
    // Start timing the page view
    metrics.startPageViewTiming(path);
    
    // Track when component unmounts (page navigation)
    return () => {
      // End timing the page view
      metrics.endPageViewTiming(path);
    };
  }, [location.pathname]);

  // This component doesn't render anything
  return null;
};

export default MetricsTracker; 