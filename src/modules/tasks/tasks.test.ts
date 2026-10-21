import { describe, expect, it } from "vitest";
import {
  createTaskSchema,
  updateTaskSchema,
  taskFiltersSchema,
} from "./schema";
describe("task contracts", () => {
  it("normalizes creation and supplies initial workflow defaults", () => {
    expect(createTaskSchema.parse({ title: "  Book venue  " })).toMatchObject({
      title: "Book venue",
      status: "TODO",
      priority: "MEDIUM",
    });
    expect(createTaskSchema.safeParse({ title: " " }).success).toBe(false);
    expect(
      createTaskSchema.safeParse({ title: "A", createdBy: "forged" }).success,
    ).toBe(false);
  });
  it("keeps patches sparse and permits clearing optional fields", () => {
    expect(updateTaskSchema.parse({ title: "New title" })).toEqual({
      title: "New title",
    });
    expect(
      updateTaskSchema.parse({
        dueDate: null,
        eventId: null,
        assignedToUserId: null,
      }),
    ).toEqual({ dueDate: null, eventId: null, assignedToUserId: null });
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
    expect(
      updateTaskSchema.safeParse({ completedAt: "2027-01-01T00:00:00Z" })
        .success,
    ).toBe(false);
  });
  it("validates timestamp ranges, statuses, references, and pagination", () => {
    expect(
      taskFiltersSchema.safeParse({
        dueAfter: "2027-02-01T00:00:00Z",
        dueBefore: "2027-01-01T00:00:00Z",
      }).success,
    ).toBe(false);
    expect(taskFiltersSchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(taskFiltersSchema.safeParse({ cursor: "invalid" }).success).toBe(
      false,
    );
    expect(
      createTaskSchema.safeParse({ title: "Task", status: "DONE" }).success,
    ).toBe(false);
    expect(
      createTaskSchema.safeParse({ title: "Task", assignedToUserId: "someone" })
        .success,
    ).toBe(false);
    expect(
      createTaskSchema.parse({
        title: "Task",
        dueDate: "2027-01-01T19:00:00+05:30",
      }).dueDate,
    ).toBeTruthy();
  });
});
