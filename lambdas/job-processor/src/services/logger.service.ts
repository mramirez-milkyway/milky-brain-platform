/**
 * Structured logging service for Lambda
 * Design: JSON-formatted logs for CloudWatch parsing
 *
 * Generic: Works with any log level and context
 */
export class Logger {
  constructor(private context: string) {}

  /**
   * Log info message
   */
  info(message: string, meta?: any): void {
    console.log(
      JSON.stringify({
        level: 'info',
        context: this.context,
        message,
        meta,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /**
   * Log error message
   */
  error(message: string, error?: any): void {
    console.error(
      JSON.stringify({
        level: 'error',
        context: this.context,
        message,
        error: error?.message || error,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: any): void {
    console.warn(
      JSON.stringify({
        level: 'warn',
        context: this.context,
        message,
        meta,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /**
   * Generic log method supporting any level
   */
  log(level: string, message: string, meta?: any): void {
    console.log(
      JSON.stringify({
        level,
        context: this.context,
        message,
        meta,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
