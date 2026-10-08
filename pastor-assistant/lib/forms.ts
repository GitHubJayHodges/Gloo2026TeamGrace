// Single-row edit pages (one row per ChurchID/EmployeeID). Safe to import from client and server.
// `table` and field names are interpolated into SQL, so they must only ever come from these constants.
export type FormDef = {
  key: string; // also the page path and API path: /<key>, /api/<key>
  table: string;
  title: string;
  intro: string;
  sections: { heading: string; grid: string; fields: { name: string; label: string }[] }[];
};
export const fieldNames = (d: FormDef) => d.sections.flatMap(s => s.fields.map(f => f.name));
export const MAX_LEN = 50; // all fields are VARCHAR(50)

export const SETTINGS: FormDef = {
  key: "settings", table: "dbo.Settings", title: "Settings",
  intro: "Keywords and names the assistant should watch for.",
  sections: [
    { heading: "Keywords", grid: "sm:grid-cols-3", fields: [
      { name: "KeywordValue01", label: "Keyword 1" }, { name: "KeywordValue02", label: "Keyword 2" },
      { name: "KeywordValue03", label: "Keyword 3" }] },
    { heading: "Key Names", grid: "sm:grid-cols-3", fields: [
      { name: "KeyNameValue01", label: "Key Name 1" }, { name: "KeyNameValue02", label: "Key Name 2" },
      { name: "KeyNameValue03", label: "Key Name 3" }] },
  ],
};

export const BAPTISM_FLOW: FormDef = {
  key: "baptism-flow", table: "dbo.BaptismFlow", title: "Baptism Flow",
  intro: "The steps a baptism request moves through.",
  sections: [
    { heading: "Baptism Request Steps", grid: "grid-cols-1", fields: [
      { name: "BaptismRequestStart", label: "1. Start" }, { name: "BaptismRequestApprove", label: "2. Approve" },
      { name: "BaptismRequestSchedule", label: "3. Schedule" }, { name: "BaptismRequestOfficiant", label: "4. Officiant" }] },
  ],
};
