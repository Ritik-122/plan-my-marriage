import "server-only";
import mongoose from "mongoose";
import { getWedding } from "@/modules/weddings/service";
import { WeddingMember } from "@/modules/weddings/models";
import { WeddingEvent } from "@/modules/events/model";
import { eventDTO } from "@/modules/events/dto";
import { Guest, EventGuest } from "@/modules/guests/models";
import { summary as taskSummary } from "@/modules/tasks/repository";
import { Task } from "@/modules/tasks/model";
import { taskDTO } from "@/modules/tasks/dto";
import { summary as expenseSummary } from "@/modules/expenses/repository";
export async function dashboard(userId: string, weddingId: string) {
  const wedding = await getWedding(userId, weddingId);
  const now = new Date();
  const [
    tasks,
    expenses,
    guests,
    eventCount,
    memberCount,
    upcoming,
    overdue,
    rsvps,
  ] = await Promise.all([
    taskSummary(weddingId),
    expenseSummary(weddingId),
    Guest.countDocuments({ weddingId }),
    WeddingEvent.countDocuments({ weddingId }),
    WeddingMember.countDocuments({ weddingId }),
    WeddingEvent.find({ weddingId, startsAt: { $gte: now } })
      .sort({ startsAt: 1, _id: 1 })
      .limit(3)
      .lean(),
    Task.find({
      weddingId,
      status: { $ne: "COMPLETED" },
      dueDate: { $ne: null, $lt: now },
    })
      .sort({ dueDate: 1, _id: 1 })
      .limit(3)
      .lean(),
    EventGuest.aggregate([
      { $match: { weddingId: new mongoose.Types.ObjectId(weddingId) } },
      { $group: { _id: "$rsvpStatus", count: { $sum: 1 } } },
    ]),
  ]);
  const day = (value: string | Date) =>
    Date.parse(
      new Date(new Date(value).getTime() + 330 * 60000)
        .toISOString()
        .slice(0, 10),
    );
  const count = (status: string) =>
    rsvps.find((r) => r._id === status)?.count ?? 0;
  return {
    countdown: {
      weddingDate: wedding.weddingDate,
      daysRemaining: Math.round(
        (day(wedding.weddingDate) - day(now)) / 86400000,
      ),
    },
    tasks,
    expenses: {
      totalAmountPaise: expenses.totalAmountPaise,
      currency: expenses.currency,
      count: expenses.count,
    },
    guests: { total: guests },
    eventRsvps: {
      attending: count("ATTENDING"),
      notAttending: count("NOT_ATTENDING"),
      pending: count("PENDING"),
    },
    eventCount,
    memberCount,
    upcomingEvents: upcoming.map(eventDTO),
    overdueTasks: overdue.map(taskDTO),
  };
}
export type DashboardDTO = Awaited<ReturnType<typeof dashboard>>;
