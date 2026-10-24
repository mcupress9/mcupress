import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
    });

    global._postgresPool.on('error', (err: any) => {
      const msg = (err?.message || '').toLowerCase();
      const isIdleDisconnect =
        msg.includes('connection terminated') ||
        msg.includes('econnreset') ||
        msg.includes('socket closed') ||
        msg.includes('closed the connection') ||
        err?.code === '57P01' ||
        err?.code === 'ECONNRESET';

      if (isIdleDisconnect) {
        // Normal behavior when Cloud SQL proxy closes idle sockets.
        // pg.Pool automatically evicts the dead client and creates a fresh one on next query.
        console.warn('[Cloud SQL] Idle client disconnected and evicted from pool:', err?.message || err);
      } else {
        console.error('Unexpected error on SQL pool client:', err?.message || err);
      }
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
