import { NavigateFunction } from 'react-router-dom';
import { debugLog } from '../config';

/**
 * Route configuration type
 */
export interface RouteConfig {
  path: string;
  name: string;
  isProtected?: boolean;
}

/**
 * Safe navigation function that handles errors
 * @param navigate - React Router's navigate function
 * @param path - Target path to navigate to
 * @param options - Navigation options
 */
export const safeNavigate = (
  navigate: NavigateFunction,
  path: string,
  options?: { replace?: boolean; state?: any }
): void => {
  try {
    debugLog(`Navigating to: ${path}`);
    navigate(path, options);
  } catch (error) {
    console.error('Navigation error:', error);
    // Fall back to simple location change
    window.location.href = path;
  }
};

/**
 * Checks if a route is valid based on available routes
 * @param path - Route path to check
 * @param availableRoutes - Array of available route configurations
 * @returns Boolean indicating if route is valid
 */
export const isValidRoute = (path: string, availableRoutes: RouteConfig[]): boolean => {
  // Check exact matches
  if (availableRoutes.some(route => route.path === path)) {
    return true;
  }
  
  // Check for dynamic routes
  const pathSegments = path.split('/').filter(Boolean);
  
  return availableRoutes.some(route => {
    const routeSegments = route.path.split('/').filter(Boolean);
    
    // Different number of segments means not a match
    if (routeSegments.length !== pathSegments.length) {
      return false;
    }
    
    // Check each segment - if route segment starts with :, it's a parameter
    return routeSegments.every((segment, index) => {
      return segment.startsWith(':') || segment === pathSegments[index];
    });
  });
};

/**
 * Converts URL parameters to a key-value object
 * @param path - Current path with parameters
 * @param routePath - Route template with parameter placeholders
 * @returns Object with parameter key-value pairs
 */
export const extractRouteParams = (path: string, routePath: string): Record<string, string> => {
  const params: Record<string, string> = {};
  
  const pathSegments = path.split('/').filter(Boolean);
  const routeSegments = routePath.split('/').filter(Boolean);
  
  routeSegments.forEach((segment, index) => {
    if (segment.startsWith(':')) {
      const paramName = segment.substring(1);
      params[paramName] = pathSegments[index] || '';
    }
  });
  
  return params;
}; 