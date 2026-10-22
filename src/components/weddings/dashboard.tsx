"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { WeddingDTO } from "@/modules/weddings/dto";
import type { DashboardDTO } from "@/modules/dashboard/service";
import { formatWeddingDate, themeNames } from "@/modules/weddings/schema";
import {
  expenseApi,
  expenseCard as card,
  money,
  expenseDate,
} from "@/components/expenses/presentation";
import { eventButton } from "@/components/events/event-shell";
export function WeddingDashboard({ wedding }: { wedding: WeddingDTO }) {
  const base = `/app/weddings/${wedding.id}`;
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await expenseApi(
          `/api/v1/weddings/${wedding.id}/dashboard`,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) setData(response.data);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Could not load your dashboard.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [wedding.id, revision]);
  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-gradient-to-r from-surface-container-low to-secondary-fixed/40 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-widest text-secondary">
          Your wedding dashboard · {themeNames[wedding.theme]}
        </p>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <h1 className="break-words font-serif text-display-sm text-primary">
              {wedding.brideName} &amp; {wedding.groomName}
            </h1>
            <p className="mt-4 text-body-md text-on-surface-variant">
              Your celebrations, your people, and everything that needs your
              attention.
            </p>
          </div>
          <Link className={eventButton} href={`${base}/edit`}>
            Edit wedding details
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-label-lg">
          <span className="rounded-lg bg-white px-3 py-2">
            {formatWeddingDate(wedding.weddingDate)}
          </span>
          <span className="min-w-0 break-words rounded-lg bg-white px-3 py-2">
            {wedding.city}
          </span>
          {data && (
            <span className="rounded-lg bg-secondary-fixed/60 px-3 py-2 text-on-secondary-fixed-variant">
              {data.countdown.daysRemaining > 0
                ? `${data.countdown.daysRemaining} days to go`
                : data.countdown.daysRemaining === 0
                  ? "Your wedding day is here"
                  : "Celebrating your journey"}
            </span>
          )}
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-primary">At a glance</h2>
        <button
          className="text-label-lg text-secondary underline disabled:opacity-50"
          disabled={loading}
          onClick={() => setRevision((v) => v + 1)}
        >
          Refresh dashboard
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-error-container p-4 text-on-error-container"
        >
          {error}
        </p>
      )}
      {loading && <p role="status">Loading dashboard…</p>}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              href={`${base}/tasks`}
              label="Tasks completed"
              value={`${data.tasks.completed}/${data.tasks.total}`}
              note={`${data.tasks.overdue} overdue · ${data.tasks.inProgress} in progress`}
            />
            <Metric
              href={`${base}/guests`}
              label="Guests"
              value={String(data.guests.total)}
              note="People on your guest list"
            />
            <Metric
              href={`${base}/expenses`}
              label="Recorded expenses"
              value={money(data.expenses.totalAmountPaise)}
              note={`${data.expenses.count} expense records`}
            />
            <Metric
              href={`${base}/events`}
              label="Celebrations"
              value={String(data.eventCount)}
              note={`${data.upcomingEvents.length ? "Upcoming events below" : "Your wedding schedule"}`}
            />
          </div>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className={card}>
              <h2 className="font-serif text-2xl text-primary">
                Needs your attention
              </h2>
              {data.overdueTasks.length ? (
                <ul className="mt-5 divide-y divide-outline-variant/30">
                  {data.overdueTasks.map((task) => (
                    <li className="py-3" key={task.id}>
                      <Link
                        href={`${base}/tasks/${task.id}`}
                        className="break-words font-semibold text-primary"
                      >
                        {task.title} →
                      </Link>
                      <p className="mt-1 text-body-sm text-secondary">
                        Overdue · {task.dueDate && expenseDate(task.dueDate)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-body-md text-on-surface-variant">
                  No overdue tasks. Keep your checklist up to date as plans come
                  together.
                </p>
              )}
              <Link
                className="mt-5 inline-block text-label-lg text-primary"
                href={`${base}/tasks`}
              >
                View task checklist →
              </Link>
            </div>
            <div className={card}>
              <h2 className="font-serif text-2xl text-primary">Event RSVPs</h2>
              <p className="mt-3 text-body-sm text-on-surface-variant">
                Responses across assigned events. One guest may respond to
                several celebrations.
              </p>
              <dl className="mt-6 grid grid-cols-3 gap-2">
                {[
                  ["Attending", data.eventRsvps.attending],
                  ["Not attending", data.eventRsvps.notAttending],
                  ["Pending", data.eventRsvps.pending],
                ].map(([label, count]) => (
                  <div
                    key={label}
                    className="rounded-lg bg-surface-container-low p-3"
                  >
                    <dt className="text-xs text-on-surface-variant">{label}</dt>
                    <dd className="mt-2 font-serif text-2xl text-primary">
                      {count}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link
                className="mt-5 inline-block text-label-lg text-primary"
                href={`${base}/events`}
              >
                Review attendance by event →
              </Link>
            </div>
          </section>
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-primary">
                Upcoming celebrations
              </h2>
              <Link
                href={`${base}/events/new`}
                className="text-label-lg text-primary"
              >
                + Add event
              </Link>
            </div>
            {data.upcomingEvents.length ? (
              <div className="grid gap-4 md:grid-cols-3">
                {data.upcomingEvents.map((event) => (
                  <article className={`${card} flex flex-col`} key={event.id}>
                    <p className="text-xs uppercase tracking-wide text-secondary">
                      {event.type.replaceAll("_", " ")}
                    </p>
                    <h3 className="mt-3 break-words font-serif text-2xl text-primary">
                      {event.name}
                    </h3>
                    <p className="mt-4 text-body-md">
                      {new Date(event.startsAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-2 break-words text-body-sm text-on-surface-variant">
                      {event.venue.name || "Venue not added yet"}
                    </p>
                    <Link
                      href={`${base}/events/${event.id}`}
                      className="mt-6 inline-block text-label-lg text-primary"
                    >
                      View event details →
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className={card}>
                <p className="text-body-md text-on-surface-variant">
                  No upcoming events scheduled. Add a celebration or view your
                  existing schedule.
                </p>
                <Link
                  className="mt-4 inline-block text-label-lg text-primary"
                  href={`${base}/events`}
                >
                  Manage events →
                </Link>
              </div>
            )}
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className={card}>
              <h2 className="font-serif text-2xl text-primary">
                Together with your team
              </h2>
              <p className="mt-4 text-body-md text-on-surface-variant">
                {data.memberCount}{" "}
                {data.memberCount === 1 ? "member is" : "members are"} helping
                bring your wedding together.
              </p>
              <Link
                className="mt-5 inline-block text-label-lg text-primary"
                href={`${base}/team`}
              >
                Team &amp; Access →
              </Link>
            </section>
            <section className={card}>
              <h2 className="font-serif text-2xl text-primary">
                Your next step
              </h2>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link className={eventButton} href={`${base}/guests/new`}>
                  Add a guest
                </Link>
                <Link
                  className="rounded-lg bg-surface-container-low px-4 py-3 text-label-lg text-primary"
                  href={`${base}/expenses`}
                >
                  Record an expense
                </Link>
                <Link
                  className="rounded-lg bg-surface-container-low px-4 py-3 text-label-lg text-primary"
                  href={`${base}/tasks`}
                >
                  Plan a task
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
function Metric({
  href,
  label,
  value,
  note,
}: {
  href: string;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Link
      href={href}
      className="min-w-0 rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="text-xs uppercase tracking-wide text-on-surface-variant">
        {label}
      </h3>
      <p className="mt-4 break-words font-serif text-3xl text-primary">
        {value}
      </p>
      <p className="mt-3 text-body-sm text-on-surface-variant">{note}</p>
    </Link>
  );
}
