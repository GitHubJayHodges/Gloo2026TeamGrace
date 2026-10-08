import sql from "mssql";
import { getPool } from "./db";
import { Status, AlertType } from "./constants";
import { type FormDef, fieldNames, MAX_LEN } from "./forms";

// ChurchID/EmployeeID filters can be added later in one place per query.
async function q<T>(text: string): Promise<T[]> {
  const r = await (await getPool()).request()
    .input("active", Status.Active).input("done", Status.Completed).input("critical", AlertType.Critical)
    .query(text);
  return r.recordset as T[];
}
const one = async (t: string) => Object.values((await q<Record<string, number>>(t))[0])[0] as number;

export const getDashboardSummary = async () => ({
  criticalAlerts: await one("SELECT COUNT(*) FROM dbo.Alert WHERE StatusID=@active AND AlertTypeID=@critical"),
  // Includes overdue; cut-off is the start of tomorrow (spec section 6.2).
  tasksRequiringAttention: await one("SELECT COUNT(*) FROM dbo.Task WHERE StatusID=@active AND TaskDueDate < DATEADD(DAY,1,CAST(GETDATE() AS DATE))"),
  activeTasks: await one("SELECT COUNT(*) FROM dbo.Task WHERE StatusID=@active"),
});
export const getTaskSummary = async () => ({
  overdue: await one("SELECT COUNT(*) FROM dbo.Task WHERE StatusID=@active AND TaskDueDate < GETDATE()"),
  upcoming: await one("SELECT COUNT(*) FROM dbo.Task WHERE StatusID=@active AND TaskDueDate >= GETDATE()"),
  completed: await one("SELECT COUNT(*) FROM dbo.Task WHERE StatusID=@done"),
});
export const getTodaysSchedule = () => q(`SELECT ID,ScheduleEntryDateTime AS time,ScheduleEntryDescription AS description,
  ScheduleEntryLocation AS location,ScheduleEntryType AS type FROM dbo.Schedule
  WHERE StatusID=@active AND ScheduleEntryDateTime >= CAST(CAST(GETDATE() AS DATE) AS DATETIME)
  AND ScheduleEntryDateTime < DATEADD(DAY,1,CAST(CAST(GETDATE() AS DATE) AS DATETIME)) ORDER BY ScheduleEntryDateTime ASC`);
// Title is display-only: email subject if linked, else shortened AlertText.
// AlertType text ranks within the critical AlertTypeID: Critical, then High, then anything else; newest first within each.
export const getCriticalAlerts = () => q(`SELECT TOP 4 a.ID,a.AlertType AS type,a.AlertText AS text,a.CreatedDateTime AS created,
  e.EmailSubject AS emailSubject FROM dbo.Alert a LEFT JOIN dbo.EmailMessage e ON e.ID=a.EmailID
  WHERE a.StatusID=@active AND a.AlertTypeID=@critical
  ORDER BY CASE a.AlertType WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 ELSE 3 END, a.CreatedDateTime DESC`);
export const getCurrentTasks = () => q(`SELECT TOP 5 ID,TaskPriority AS priority,TaskEntryDescription AS description,
  TaskDueDate AS due,TaskEntryType AS type FROM dbo.Task WHERE StatusID=@active ORDER BY TaskDueDate ASC`);
const HEADER_EMPLOYEE_ID = 1;
export const getDashboard = async () => {
  const [summary, taskSummary, todaysSchedule, criticalAlerts, currentTasks, employeeName] = await Promise.all([
    getDashboardSummary(), getTaskSummary(), getTodaysSchedule(), getCriticalAlerts(), getCurrentTasks(),
    // Header name; a failed lookup shouldn't take the dashboard down.
    getEmployeeName(HEADER_EMPLOYEE_ID).catch(() => null)]);
  return { summary, taskSummary, todaysSchedule, criticalAlerts, currentTasks, employeeName };
};

export async function getEmployeeName(id: number): Promise<string | null> {
  const r = await (await getPool()).request().input("id", sql.Int, id)
    .query("SELECT FirstName, LastName FROM dbo.Employee WHERE ID=@id");
  const e = r.recordset[0];
  return e ? [e.FirstName, e.LastName].map(v => v?.trim()).filter(Boolean).join(" ") || null : null;
}

// Single-row pages (Settings, Baptism Flow): one row per ChurchID/EmployeeID (from env; blank means NULL).
export type FormRow = Record<string, string | null>;
const envInt = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : null);
async function ownerRequest() {
  return (await getPool()).request()
    .input("church", sql.Int, envInt(process.env.CHURCH_ID))
    .input("employee", sql.Int, envInt(process.env.EMPLOYEE_ID))
    .input("active", sql.Int, Status.Active);
}
const OWNER_MATCH = `(ChurchID=@church OR (ChurchID IS NULL AND @church IS NULL))
  AND (EmployeeID=@employee OR (EmployeeID IS NULL AND @employee IS NULL)) AND StatusID=@active`;

export async function getFormRow(d: FormDef): Promise<FormRow | null> {
  const r = await (await ownerRequest()).query(
    `SELECT TOP 1 ${fieldNames(d).join(",")} FROM ${d.table} WHERE ${OWNER_MATCH} ORDER BY ID DESC`);
  return (r.recordset[0] as FormRow) ?? null;
}

// Updates the existing row, or inserts one if none exists. The lock hints stop two saves racing into duplicate rows.
export async function saveFormRow(d: FormDef, values: FormRow) {
  const fields = fieldNames(d);
  const req = await ownerRequest();
  fields.forEach((f, i) => req.input(`v${i}`, sql.VarChar(MAX_LEN), values[f] ?? null));
  const params = fields.map((_, i) => `@v${i}`);
  const r = await req.query(`SET XACT_ABORT ON; BEGIN TRAN;
    DECLARE @id INT = (SELECT TOP 1 ID FROM ${d.table} WITH (UPDLOCK, HOLDLOCK) WHERE ${OWNER_MATCH} ORDER BY ID DESC);
    IF @id IS NOT NULL
      UPDATE ${d.table} SET ${fields.map((f, i) => `${f}=${params[i]}`).join(",")},
        UpdatedDateTime=GETDATE(),UpdatedEmployeeID=@employee WHERE ID=@id;
    ELSE BEGIN
      INSERT ${d.table} (ChurchID,EmployeeID,${fields.join(",")},StatusID,
        CreatedDateTime,CreatedEmployeeID,UpdatedDateTime,UpdatedEmployeeID)
      VALUES (@church,@employee,${params.join(",")},@active,GETDATE(),@employee,GETDATE(),@employee);
      SET @id = SCOPE_IDENTITY();
    END
    COMMIT; SELECT @id AS id;`);
  return r.recordset[0].id as number;
}
