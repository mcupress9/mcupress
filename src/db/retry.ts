/**
 * Executes a database operation with bounded retry for transient connection drops.
 * Follows Cloud SQL guidelines:
 * - Max 2 retries (total 3 attempts)
 * - Delay >= 500ms with jitter
 * - Never retries authentication, constraint, or schema errors
 */
export async function withDbRetry<T>(operation: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      const errMsg = (
        (error?.message || '') +
        ' ' +
        (error?.cause?.message || '') +
        ' ' +
        (error?.cause?.stack || '')
      ).toLowerCase();

      const isConnectionError =
        errMsg.includes('connection terminated') ||
        errMsg.includes('closed the connection') ||
        errMsg.includes('econnreset') ||
        errMsg.includes('epipe') ||
        errMsg.includes('terminating connection') ||
        errMsg.includes('connection timeout') ||
        error?.code === '57P01' ||
        error?.code === 'ECONNRESET';

      if (attempt <= maxRetries && isConnectionError) {
        const delay = 500 + Math.random() * 250;
        console.warn(
          `[Cloud SQL] Connection interrupted (${attempt}/${maxRetries}), re-establishing in ${Math.round(delay)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
}
