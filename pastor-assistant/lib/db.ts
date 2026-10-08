import sql from "mssql";
// Server-side only. Credentials come from environment variables.
let pool: Promise<sql.ConnectionPool> | null = null;
export function getPool() {
  if (!pool) {

console.log("DB cfg", process.env.DB_SERVER, process.env.DB_PORT, process.env.DB_NAME,
  process.env.DB_USER, JSON.stringify(process.env.DB_ENCRYPT), JSON.stringify(process.env.DB_TRUST_SERVER_CERTIFICATE));

    pool = new sql.ConnectionPool({
      server: process.env.DB_SERVER ?? "localhost",
      port: Number(process.env.DB_PORT ?? 1433),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,

pool: { max: 1, min: 0, idleTimeoutMillis: 300000 },

      options: { encrypt: process.env.DB_ENCRYPT === "true", trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true" },
    }).connect().catch((e) => { pool = null; throw e; });
  }
  return pool;
}
