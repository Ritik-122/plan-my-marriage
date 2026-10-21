import { z } from "zod";
export const statuses = ["TODO", "IN_PROGRESS", "COMPLETED"] as const;
export const priorities = ["LOW", "MEDIUM", "HIGH"] as const;
const id = z.string().regex(/^[a-f\d]{24}$/i);
const timestamp = z.iso.datetime({ offset: true });
export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).default(""),
    eventId: id.nullable().optional(),
    assignedToUserId: id.nullable().optional(),
    dueDate: timestamp.nullable().optional(),
    priority: z.enum(priorities).default("MEDIUM"),
    status: z.enum(statuses).default("TODO"),
  })
  .strict();
export const updateTaskSchema = createTaskSchema
  .extend({
    description: z.string().trim().max(2000),
    priority: z.enum(priorities),
    status: z.enum(statuses),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Choose a field to update.");
export const taskFiltersSchema = z
  .object({
    status: z.enum(statuses).optional(),
    priority: z.enum(priorities).optional(),
    eventId: id.optional(),
    assignedToUserId: id.optional(),
    dueBefore: timestamp.optional(),
    dueAfter: timestamp.optional(),
    cursor: id.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().max(200).optional(),
    overdue: z.enum(["true", "false"]).optional(),
  })
  .strict()
  .refine(
    (v) =>
      !v.dueBefore ||
      !v.dueAfter ||
      Date.parse(v.dueAfter) <= Date.parse(v.dueBefore),
    "Check date range.",
  );
export type TaskInput = z.infer<typeof createTaskSchema>;
export type TaskUpdate = z.infer<typeof updateTaskSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
