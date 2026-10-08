const sql = require("mssql");
const cfg = { server: process.env.DB_SERVER, port: Number(process.env.DB_PORT), database: process.env.DB_NAME,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  options: { encrypt: true, trustServerCertificate: true } };
const step = async (name, fn) => { try { console.log(name, "OK", await fn()); } catch (e) { console.log(name, "FAILED:", e.code, e.message); } };
(async () => {
  const pool = await new sql.ConnectionPool(cfg).connect();
  await step("plain table query", async () => (await pool.request().query("SELECT COUNT(*) AS n FROM dbo.Alert")).recordset);
  await step("parameterized query", async () => (await pool.request().input("active", 100).query("SELECT COUNT(*) AS n FROM dbo.Task WHERE StatusID=@active")).recordset);
  await step("5 concurrent queries", async () => (await Promise.all([1,2,3,4,5].map(() => pool.request().input("a", 100).query("SELECT COUNT(*) AS n FROM dbo.Task WHERE StatusID=@a")))).length);
  await pool.close();
})();