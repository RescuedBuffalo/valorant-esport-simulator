// Configuration for the application
export const config = {
    // API configuration
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    API_TIMEOUT: Number(process.env.REACT_APP_API_TIMEOUT) || 10000,
    
    // App configuration
    VERSION: '0.1.0',
    
    // Debug mode
    DEBUG: process.env.NODE_ENV !== 'production',
    
    // Route configuration
    BASE_PATH: process.env.PUBLIC_URL || '',
    
    // Development settings
    DEV_SERVER_PORT: 3001,
    
    // Metrics
    ENABLE_DEV_METRICS: process.env.REACT_APP_ENABLE_DEV_METRICS === 'true' || false,
};

// Helper log function that only prints in debug mode
export const debugLog = (...args: any[]) => {
    if (config.DEBUG) {
        console.log('[DEBUG]', ...args);
    }
};

export default config; 