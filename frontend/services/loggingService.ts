// Logging and monitoring service for backend tracking

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  message: string;
  data?: any;
  userId?: string;
  requestId?: string;
}

interface PerformanceMetric {
  service: string;
  operation: string;
  duration: number;
  timestamp: string;
  status: 'success' | 'failure';
}

// In-memory log store (in production, use a persistent database)
const logs: LogEntry[] = [];
const metrics: PerformanceMetric[] = [];
const MAX_LOGS = 1000;

export const logger = {
  // Log methods
  debug: (service: string, message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      service,
      message,
      data,
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    console.debug(`[${service}] ${message}`, data);
  },

  info: (service: string, message: string, data?: any, userId?: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service,
      message,
      data,
      userId,
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    console.info(`[${service}] ${message}`, data);
  },

  warn: (service: string, message: string, data?: any, userId?: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      service,
      message,
      data,
      userId,
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    console.warn(`[${service}] ${message}`, data);
  },

  error: (service: string, message: string, error?: Error, userId?: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      service,
      message,
      data: error ? { message: error.message, stack: error.stack } : null,
      userId,
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    console.error(`[${service}] ${message}`, error);
  },

  // Get logs
  getLogs: (filters?: { service?: string; level?: string; minutes?: number }) => {
    let filtered = [...logs];

    if (filters?.service) {
      filtered = filtered.filter((l) => l.service === filters.service);
    }

    if (filters?.level) {
      filtered = filtered.filter((l) => l.level === filters.level);
    }

    if (filters?.minutes) {
      const cutoff = new Date(Date.now() - filters.minutes * 60 * 1000);
      filtered = filtered.filter((l) => new Date(l.timestamp) > cutoff);
    }

    return filtered;
  },

  // Clear logs
  clearLogs: () => {
    logs.length = 0;
  },
};

export const performanceMonitor = {
  // Record performance metrics
  recordMetric: (service: string, operation: string, duration: number, status: 'success' | 'failure' = 'success') => {
    const metric: PerformanceMetric = {
      service,
      operation,
      duration,
      timestamp: new Date().toISOString(),
      status,
    };
    metrics.push(metric);
    if (metrics.length > MAX_LOGS) metrics.shift();

    if (duration > 5000) {
      logger.warn('PerformanceMonitor', `Slow operation detected: ${service}.${operation} (${duration}ms)`);
    }
  },

  // Decorator for measuring function execution time
  measure: (service: string, operation: string) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const start = performance.now();
        try {
          const result = await originalMethod.apply(this, args);
          const duration = performance.now() - start;
          performanceMonitor.recordMetric(service, operation, duration, 'success');
          return result;
        } catch (error) {
          const duration = performance.now() - start;
          performanceMonitor.recordMetric(service, operation, duration, 'failure');
          throw error;
        }
      };

      return descriptor;
    };
  },

  // Get metrics
  getMetrics: (filters?: { service?: string; minutes?: number }) => {
    let filtered = [...metrics];

    if (filters?.service) {
      filtered = filtered.filter((m) => m.service === filters.service);
    }

    if (filters?.minutes) {
      const cutoff = new Date(Date.now() - filters.minutes * 60 * 1000);
      filtered = filtered.filter((m) => new Date(m.timestamp) > cutoff);
    }

    return filtered;
  },

  // Get average duration for operation
  getAverageDuration: (service: string, operation: string) => {
    const relevant = metrics.filter((m) => m.service === service && m.operation === operation);
    if (relevant.length === 0) return 0;
    return relevant.reduce((sum, m) => sum + m.duration, 0) / relevant.length;
  },

  // Clear metrics
  clearMetrics: () => {
    metrics.length = 0;
  },
};

// Error tracking
export const errorTracker = {
  trackError: (error: Error, context?: { userId?: string; endpoint?: string; method?: string }) => {
    logger.error('ErrorTracker', error.message, error, context?.userId);

    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    if ((import.meta.env as any).VITE_SENTRY_DSN) {
      // Example: Sentry.captureException(error);
    }
  },

  trackUnhandledRejection: (reason: any) => {
    logger.error('UnhandledRejection', 'Unhandled promise rejection', new Error(String(reason)));
  },
};

// Initialize error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.trackError(event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.trackUnhandledRejection(event.reason);
  });
}

export default { logger, performanceMonitor, errorTracker };
