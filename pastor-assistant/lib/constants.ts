export const Status = { Active: 100, Deleted: 101, Suspended: 102, Completed: 105 } as const;
export const AlertType = { Critical: 1, Important: 2, Unimportant: 3 } as const;
export const Sentiment = { Negative: 1, Neutral: 2, Positive: 3 } as const;
export const ScheduleEntryType = { Meeting: 1, ChurchEvent: 2, PersonalAppointment: 3 } as const;
export const TaskEntryType = { ProjectTask: 1, Research: 2, PersonalTask: 3 } as const;
