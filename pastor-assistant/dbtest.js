const sql = require("mssql");
(async () => {
  for (const server of ["localhost", "::1", "127.0.0.1"]) {
    try {
      const pool = await new sql.ConnectionPool({
        server, port: Number(process.env.DB_PORT), database: process.env.DB_NAME,
        user: process.env.DB_USER, password: process.env.DB_PASSWORD,
        options: { encrypt: true, trustServerCertificate: true },
      }).connect();
      console.log(server, "OK", (await pool.request().query("SELECT 1 AS x")).recordset);
      await pool.close();
    } catch (e) { console.log(server, "FAILED:", e.code, e.message); }
  }
})();