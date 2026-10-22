"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { eventButton } from "@/components/events/event-shell";
import { categories, categoryLabel } from "@/modules/expenses/schema";
import type { ExpenseDTO, ExpenseSummary } from "@/modules/expenses/dto";
import type { EventDTO } from "@/modules/events/dto";
import { ExpenseEditor } from "./expense-editor";
import {
  expenseApi as api,
  money,
  expenseDate,
  expenseCard as card,
  expenseField as field,
  expenseSecondary as secondary,
} from "./presentation";
const blank = { q: "", category: "", eventId: "", dateFrom: "", dateTo: "" };
function query(filters: typeof blank) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value)
      params.set(
        key,
        key === "dateFrom"
          ? new Date(`${value}T00:00:00+05:30`).toISOString()
          : key === "dateTo"
            ? new Date(`${value}T23:59:59.999+05:30`).toISOString()
            : value,
      );
  return params;
}
export function ExpenseWorkspace({
  weddingId,
  expenseId,
}: {
  weddingId: string;
  expenseId?: string;
}) {
  const base = `/api/v1/weddings/${weddingId}/expenses`;
  const pageBase = `/app/weddings/${weddingId}/expenses`;
  const router = useRouter();
  const [rows, setRows] = useState<ExpenseDTO[]>([]);
  const [expense, setExpense] = useState<ExpenseDTO | null>(null);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [filters, setFilters] = useState(blank);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<{ expense?: ExpenseDTO } | null>(null);
  const [revision, setRevision] = useState(0);
  const version = useRef(0);
  const deletion = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    const current = ++version.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const [result, totals, ceremonies] = await Promise.all([
          api(
            expenseId ? `${base}/${expenseId}` : `${base}?${query(filters)}`,
            { signal: controller.signal },
          ),
          api(`${base}/summary`, { signal: controller.signal }),
          api(`/api/v1/weddings/${weddingId}/events`, {
            signal: controller.signal,
          }),
        ]);
        if (current !== version.current) return;
        setSummary(totals.data);
        setEvents(ceremonies.data);
        if (expenseId) setExpense(result.data);
        else {
          setRows(result.data);
          setCursor(result.meta?.nextCursor ?? null);
        }
      } catch (e) {
        if (!controller.signal.aborted && current === version.current)
          setError(e instanceof Error ? e.message : "Could not load expenses.");
      } finally {
        if (!controller.signal.aborted && current === version.current)
          setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [base, weddingId, expenseId, filters, revision]);
  async function more() {
    const current = version.current;
    setBusy(true);
    setError("");
    try {
      const params = query(filters);
      params.set("cursor", cursor!);
      const result = await api(`${base}?${params}`);
      if (current === version.current) {
        setRows((old) => [...old, ...result.data]);
        setCursor(result.meta?.nextCursor ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load expenses.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api(`${base}/${expenseId}`, { method: "DELETE" });
      deletion.current?.close();
      router.push(pageBase);
    } catch (e) {
      deletion.current?.close();
      setError(
        e instanceof Error
          ? e.message
          : "Could not confirm deletion. Refresh to check.",
      );
    } finally {
      setBusy(false);
    }
  }
  const eventName = (id: string | null) =>
    id
      ? (events.find((e) => e.id === id)?.name ?? "Unavailable event")
      : "General wedding";
  const event = events.find((e) => e.id === expense?.eventId);
  return (
    <div className="space-y-7">
      {expenseId ? (
        <Link href={pageBase} className="text-label-lg text-secondary">
          ← Back to expenses
        </Link>
      ) : (
        <p className="text-xs uppercase tracking-widest text-secondary">
          Your wedding spending record
        </p>
      )}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words font-serif text-display-sm text-primary">
            {expenseId
              ? (expense?.name ?? "Expense details")
              : "Wedding Expenses"}
          </h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Keep a simple record of what you’ve spent across your wedding.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={eventButton}
            disabled={loading || !summary || (!!expenseId && !expense)}
            onClick={() => setEditor(expenseId ? { expense: expense! } : {})}
          >
            {expenseId ? "Edit expense" : "+ Add expense"}
          </button>
          {expenseId && expense && (
            <button
              className={secondary}
              disabled={busy}
              onClick={() => deletion.current?.showModal()}
            >
              Delete expense
            </button>
          )}
        </div>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-error-container p-4 text-on-error-container"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-tertiary-fixed/50 p-3 text-tertiary"
        >
          {notice}
        </p>
      )}
      <button
        className="text-label-lg text-secondary underline"
        disabled={loading}
        onClick={() => setRevision((v) => v + 1)}
      >
        Refresh expenses
      </button>
      {loading && <p role="status">Loading expenses…</p>}
      {!expenseId && summary && (
        <>
          <section
            className={`${card} bg-gradient-to-r from-white to-surface-container-low`}
          >
            <p className="text-xs uppercase tracking-widest text-secondary">
              Total recorded expenses
            </p>
            <p className="mt-3 break-words font-serif text-4xl text-primary sm:text-5xl">
              {money(summary.totalAmountPaise)}
            </p>
            <p className="mt-3 text-body-sm text-on-surface-variant">
              {summary.count} recorded expenses · Across all events and
              categories
            </p>
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <Breakdown
              title="By category"
              total={summary.totalAmountPaise}
              rows={summary.byCategory.map((c) => ({
                key: c.category,
                label: categoryLabel(c.category),
                amount: c.amountPaise,
              }))}
            />
            <Breakdown
              title="By event"
              total={summary.totalAmountPaise}
              rows={summary.byEvent.map((e) => ({
                key: e.eventId ?? "general",
                label: eventName(e.eventId),
                amount: e.amountPaise,
              }))}
            />
          </div>
          <section aria-label="Expense filters" className={card}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-label-lg">
                Search expenses
                <input
                  className={field}
                  value={filters.q}
                  maxLength={200}
                  placeholder="Name, vendor or notes"
                  onChange={(e) =>
                    setFilters({ ...filters, q: e.target.value })
                  }
                />
              </label>
              <label className="text-label-lg">
                Category
                <select
                  className={field}
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(c)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-label-lg">
                Event
                <select
                  className={field}
                  value={filters.eventId}
                  onChange={(e) =>
                    setFilters({ ...filters, eventId: e.target.value })
                  }
                >
                  <option value="">All events</option>
                  <option value="general">General wedding</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-label-lg">
                From date
                <input
                  className={field}
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                />
              </label>
              <label className="text-label-lg">
                To date
                <input
                  className={field}
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                />
              </label>
              <button
                className={`${secondary} self-end`}
                onClick={() => setFilters(blank)}
              >
                Reset filters
              </button>
            </div>
            <p className="mt-4 text-body-sm text-on-surface-variant">
              Newest expense date first. Filters apply to the list; totals above
              show the whole wedding.
            </p>
          </section>
          {!loading && !rows.length && (
            <section className={`${card} text-center`}>
              <h2 className="font-serif text-2xl text-primary">
                {Object.values(filters).some(Boolean)
                  ? "No expenses match these filters"
                  : "Your spending story starts here"}
              </h2>
              <p className="mt-3 text-on-surface-variant">
                {Object.values(filters).some(Boolean)
                  ? "Try adjusting your search or filters."
                  : "Record your first expense to see the totals take shape."}
              </p>
            </section>
          )}
          <div className="space-y-3" aria-busy={loading}>
            {rows.map((row) => (
              <article
                key={row.id}
                className="flex flex-col gap-4 rounded-xl bg-white p-5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`${pageBase}/${row.id}`}
                    className="break-words font-semibold text-primary"
                  >
                    {row.name}
                  </Link>
                  <p className="mt-2 break-words text-body-sm text-on-surface-variant">
                    {categoryLabel(row.category)} · {eventName(row.eventId)}
                  </p>
                  <p className="mt-1 break-words text-body-sm text-on-surface-variant">
                    {expenseDate(row.expenseDate)}
                    {row.vendorName ? ` · ${row.vendorName}` : ""}
                    {row.paidBy ? ` · Paid by ${row.paidBy}` : ""}
                  </p>
                </div>
                <p className="break-words font-semibold text-primary">
                  {money(row.amountPaise)}
                </p>
                <Link
                  className="text-label-lg text-primary"
                  href={`${pageBase}/${row.id}`}
                >
                  View →
                </Link>
              </article>
            ))}
          </div>
          {cursor && (
            <button
              disabled={busy || loading}
              className={secondary}
              onClick={more}
            >
              {busy ? "Loading…" : "Load more expenses"}
            </button>
          )}
        </>
      )}
      {expenseId && expense && (
        <>
          <section
            className={`${card} grid gap-6 bg-gradient-to-r from-white to-surface-container-low sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]`}
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-secondary">
                Recorded expense amount
              </p>
              <p className="mt-4 break-words font-serif text-4xl text-primary sm:text-5xl">
                {money(expense.amountPaise)}
              </p>
              <p className="mt-4 text-body-md">
                {categoryLabel(expense.category)}
              </p>
              <p className="mt-3 text-body-sm text-on-surface-variant">
                Recorded {expenseDate(expense.createdAt)} · Updated{" "}
                {expenseDate(expense.updatedAt)}
              </p>
            </div>
            <dl className="space-y-5">
              <div className="rounded-lg bg-surface-container-low p-4">
                <dt className="text-xs uppercase text-secondary">
                  Expense date
                </dt>
                <dd className="mt-2 font-semibold">
                  {expenseDate(expense.expenseDate)}
                </dd>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <dt className="text-xs uppercase text-secondary">Paid by</dt>
                <dd className="mt-2 break-words font-semibold">
                  {expense.paidBy || "Not specified"}
                </dd>
              </div>
            </dl>
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className={`${card} space-y-4`}>
              <h2 className="font-serif text-2xl text-primary">
                Event connection
              </h2>
              <p className="break-words font-semibold">
                {eventName(expense.eventId)}
              </p>
              {event && (
                <>
                  <p className="text-body-md">{expenseDate(event.startsAt)}</p>
                  {event.venue.name && (
                    <p className="break-words text-body-md">
                      {event.venue.name}
                    </p>
                  )}
                  <Link
                    className="inline-block text-label-lg text-primary"
                    href={`/app/weddings/${weddingId}/events/${event.id}`}
                  >
                    View event details →
                  </Link>
                </>
              )}
              {!expense.eventId && (
                <p className="text-body-md text-on-surface-variant">
                  This expense is not tied to a specific ceremony.
                </p>
              )}
            </section>
            <section className={`${card} space-y-4`}>
              <h2 className="font-serif text-2xl text-primary">Vendor name</h2>
              <p className="break-words text-body-md">
                {expense.vendorName || "No vendor name recorded."}
              </p>
            </section>
          </div>
          <section className={card}>
            <h2 className="font-serif text-2xl text-primary">Notes</h2>
            <p className="mt-4 whitespace-pre-wrap break-words text-body-md text-on-surface-variant">
              {expense.notes || "No notes added."}
            </p>
          </section>
        </>
      )}
      {editor && (
        <ExpenseEditor
          base={base}
          expense={editor.expense}
          events={events}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setNotice("Expense saved.");
            setRevision((v) => v + 1);
          }}
        />
      )}
      <dialog
        ref={deletion}
        aria-labelledby="expense-delete-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl p-6 backdrop:bg-black/40"
      >
        <h2
          id="expense-delete-title"
          className="font-serif text-2xl text-primary"
        >
          Delete this expense?
        </h2>
        <p className="mt-4 break-words">
          “{expense?.name}” will be removed from your records and totals. This
          cannot be undone.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            className={secondary}
            disabled={busy}
            onClick={() => deletion.current?.close()}
          >
            Cancel
          </button>
          <button className={eventButton} disabled={busy} onClick={remove}>
            {busy ? "Deleting…" : "Confirm delete"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
function Breakdown({
  title,
  total,
  rows,
}: {
  title: string;
  total: number;
  rows: { key: string; label: string; amount: number }[];
}) {
  return (
    <section className={card}>
      <h2 className="font-serif text-2xl text-primary">{title}</h2>
      {!rows.length ? (
        <p className="mt-4 text-body-md text-on-surface-variant">
          No expenses recorded yet.
        </p>
      ) : (
        <ul className="mt-5 max-h-80 space-y-4 overflow-y-auto pr-1">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex flex-wrap justify-between gap-2 text-body-md">
                <span className="min-w-0 break-words">{row.label}</span>
                <span>{money(row.amount)}</span>
              </div>
              <div
                aria-hidden="true"
                className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container"
              >
                <div
                  className="h-full rounded-full bg-primary-container"
                  style={{
                    width: `${total ? (row.amount / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
