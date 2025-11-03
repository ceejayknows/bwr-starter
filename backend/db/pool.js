// backend/db/pool.js
import pkg from 'pg';
const { Pool } = pkg;

/**
 * Prefer DATABASE_URL. If not set, fall back to individual PG* env vars.
 * Examples:
 *   DATABASE_URL=postgresql://postgres:P%40ss%3Aword@localhost:5432/bwr
 *   PGHOST=localhost PGPORT=5432 PGDATABASE=bwr PGUSER=postgres PGPASSWORD=yourpass
 */
const useUrl = !!process.env.DATABASE_URL;

const poolConfig = useUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      // Toggle SSL easily if you deploy (Heroku/Railway often need this):
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE || 'bwr',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD, // must be a string
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
    };

export const pool = new Pool(poolConfig);

// Optional: quick startup sanity log (remove if too chatty)
pool
  .connect()
  .then((client) => {
    client.release();
    console.log(
      `[pg] connected (${
        useUrl ? 'DATABASE_URL' : `${poolConfig.user}@${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`
      })`
    );
  })
  .catch((err) => {
    console.error('[pg] connection error:', err.message);
  });
