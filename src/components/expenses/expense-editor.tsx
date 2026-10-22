"use client";
import { useEffect, useRef, useState } from "react";
import { eventButton } from "@/components/events/event-shell";
import {
  categories,
  categoryLabel,
  maxRupees,
} from "@/modules/expenses/schema";
import type { ExpenseDTO } from "@/modules/expenses/dto";
import type { EventDTO } from "@/modules/events/dto";
import {
  calendarDate,
  expenseField as field,
  expenseSecondary as secondary,
} from "./presentation";
export function ExpenseEditor({
  base,
  expense,
  events,
  onClose,
  onSaved,
}: {
  base: string;
  expense?: ExpenseDTO;
  events: EventDTO[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unknown, setUnknown] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setFields({});
    const form = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      name: form.get("name"),
      category: form.get("category"),
      amount: Number(form.get("amount")),
      date: new Date(`${form.get("date")}T00:00:00+05:30`).toISOString(),
      eventId: form.get("eventId") || null,
      vendorName: form.get("vendorName"),
      paidBy: form.get("paidBy"),
      notes: form.get("notes"),
    };
    // Preserve original API timestamps unless the organizer changes the calendar date.
    if (expense && form.get("date") === calendarDate(expense.expenseDate))
      delete payload.date;
    if (expense && payload.eventId === expense.eventId) delete payload.eventId;
    try {
      const response = await fetch(expense ? `${base}/${expense.id}` : base, {
        method: expense ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error?.message ?? "Could not save the expense.");
        setFields(result.error?.fields ?? {});
      } else onSaved();
    } catch {
      setUnknown(true);
      setError(
        "The save could not be confirmed. Close this form and refresh the expense list before trying again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function hint(name: string) {
    return fields[name] ? (
      <span
        id={`expense-${name}-error`}
        className="mt-1 block text-body-sm text-error"
      >
        {fields[name]}
      </span>
    ) : null;
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="expense-editor-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
      onClose={onClose}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border-t-4 border-primary-container p-5 backdrop:bg-primary/30 sm:p-8"
    >
      <h2
        id="expense-editor-title"
        className="font-serif text-3xl text-primary"
      >
        {expense ? "Edit expense" : "Add expense"}
      </h2>
      <p className="mt-2 text-body-md text-on-surface-variant">
        Keep a clear record of what you’ve spent across your celebrations.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-5">
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-error-container p-3 text-on-error-container"
          >
            {error}
          </p>
        )}
        <label className="block text-label-lg">
          Expense name
          <input
            className={field}
            name="name"
            required
            maxLength={200}
            defaultValue={expense?.name}
            autoFocus
            aria-invalid={!!fields.name}
            aria-describedby={fields.name ? "expense-name-error" : undefined}
          />
          {hint("name")}
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-label-lg">
            Category
            <select
              name="category"
              className={field}
              defaultValue={expense?.category ?? "OTHER"}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-label-lg">
            Amount (INR)
            <input
              name="amount"
              type="number"
              min="0"
              max={maxRupees}
              step="0.01"
              inputMode="decimal"
              required
              className={field}
              defaultValue={
                expense ? (expense.amountPaise / 100).toFixed(2) : ""
              }
              aria-invalid={!!fields.amount}
              aria-describedby={
                fields.amount ? "expense-amount-error" : undefined
              }
            />
            {hint("amount")}
            <span className="mt-1 block text-body-sm font-normal text-on-surface-variant">
              Up to two decimal places.
            </span>
          </label>
        </div>
        <label className="block text-label-lg">
          Expense date
          <input
            name="date"
            type="date"
            required
            className={field}
            defaultValue={expense ? calendarDate(expense.expenseDate) : ""}
            aria-invalid={!!fields.date}
          />
          {hint("date")}
        </label>
        <label className="block text-label-lg">
          Related event (optional)
          <select
            name="eventId"
            className={field}
            defaultValue={expense?.eventId ?? ""}
          >
            <option value="">General wedding</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          {hint("eventId")}
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-label-lg">
            Vendor name (optional)
            <input
              name="vendorName"
              className={field}
              maxLength={200}
              defaultValue={expense?.vendorName}
            />
          </label>
          <label className="text-label-lg">
            Paid by (optional)
            <input
              name="paidBy"
              className={field}
              maxLength={100}
              defaultValue={expense?.paidBy}
              placeholder="Person’s name"
            />
          </label>
        </div>
        <label className="block text-label-lg">
          Notes (optional)
          <textarea
            name="notes"
            rows={3}
            className={field}
            maxLength={2000}
            defaultValue={expense?.notes}
          />
        </label>
        <div className="sticky -bottom-5 flex flex-wrap justify-end gap-3 border-t border-outline-variant/30 bg-white py-4 sm:-bottom-8">
          <button
            type="button"
            className={secondary}
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className={eventButton} disabled={busy || unknown}>
            {busy ? "Saving…" : expense ? "Save changes" : "Create expense"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
