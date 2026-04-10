// Environment configuration service

interface Config {
  apiUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableLogging: boolean;
  enablePerformanceMonitoring: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
}

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = (import.meta.env as any)[`VITE_${key}`] || (import.meta.env as any)[key];
  return value || defaultValue || '';
};

export const config: Config = {
  apiUrl: getEnvVariable('API_URL', 'http://localhost:5000'),
  isProduction: getEnvVariable('MODE') === 'production',
  isDevelopment: getEnvVariable('MODE') === 'development',
  isTest: getEnvVariable('MODE') === 'test',
  logLevel: (getEnvVariable('LOG_LEVEL', 'info') as any) || 'info',
  enableLogging: getEnvVariable('ENABLE_LOGGING', 'true') === 'true',
  enablePerformanceMonitoring: getEnvVariable('ENABLE_PERF_MONITORING', 'true') === 'true',
  cacheEnabled: getEnvVariable('CACHE_ENABLED', 'true') === 'true',
  cacheTTL: parseInt(getEnvVariable('CACHE_TTL', '3600000'), 10),
};

// Feature flags
export const featureFlags = {
  enableGeoLocation: getEnvVariable('ENABLE_GEOLOCATION', 'true') === 'true',
  enableNotifications: getEnvVariable('ENABLE_NOTIFICATIONS', 'true') === 'true',
  enableAnalytics: getEnvVariable('ENABLE_ANALYTICS', 'true') === 'true',
  enableDebugMode: getEnvVariable('DEBUG_MODE', 'false') === 'true',
  enableMockData: getEnvVariable('USE_MOCK_DATA', 'false') === 'true',
};

// Validation
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.apiUrl) {
    errors.push('API_URL is required');
  }

  if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
    errors.push('Invalid LOG_LEVEL');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Log config
export const logConfig = (): void => {
  console.log('=== FlavorFinder Configuration ===');
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Environment: ${config.isProduction ? 'Production' : config.isDevelopment ? 'Development' : 'Test'}`);
  console.log(`Log Level: ${config.logLevel}`);
  console.log(`Feature Flags:`, featureFlags);
  console.log('===================================');
};

export default { config, featureFlags, validateConfig, logConfig };
