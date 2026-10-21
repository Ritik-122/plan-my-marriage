"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { eventButton } from "@/components/events/event-shell";
import type { TaskDTO, TaskOptions, TaskSummary } from "@/modules/tasks/dto";
import { statuses, priorities } from "@/modules/tasks/schema";
const labels = { TODO: "To do", IN_PROGRESS: "In progress", COMPLETED: "Done" };
const field =
  "mt-2 block w-full min-w-0 rounded-lg border border-outline-variant/40 bg-surface-container-low p-3 text-body-md";
const secondary =
  "rounded-lg border border-outline-variant px-4 py-3 text-label-lg disabled:opacity-50";
const card = "rounded-xl bg-white p-5 shadow-sm sm:p-7";
const blankFilters = {
  q: "",
  status: "",
  priority: "",
  assignedToUserId: "",
  eventId: "",
  overdue: false,
};
function dateLabel(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "No due date";
}
function localInput(value: string | null) {
  return value
    ? new Date(Date.parse(value) + 330 * 60000).toISOString().slice(0, 16)
    : "";
}
function Badge({ status }: { status: TaskDTO["status"] }) {
  return (
    <span
      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${status === "COMPLETED" ? "bg-tertiary-fixed text-tertiary" : status === "IN_PROGRESS" ? "bg-secondary-fixed text-on-secondary-fixed-variant" : "bg-surface-container text-on-surface-variant"}`}
    >
      {labels[status]}
    </span>
  );
}
async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok)
    throw new Error(
      body?.error?.message ?? "Unable to save. Please try again.",
    );
  return body;
}
export function TaskWorkspace({
  weddingId,
  taskId,
}: {
  weddingId: string;
  taskId?: string;
}) {
  const router = useRouter();
  const base = `/api/v1/weddings/${weddingId}/tasks`;
  const pageBase = `/app/weddings/${weddingId}/tasks`;
  const [rows, setRows] = useState<TaskDTO[]>([]);
  const [task, setTask] = useState<TaskDTO | null>(null);
  const [context, setContext] = useState<{
    options: TaskOptions;
    summary: TaskSummary;
  } | null>(null);
  const [filters, setFilters] = useState(blankFilters);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<{ task?: TaskDTO } | null>(null);
  const [revision, setRevision] = useState(0);
  const deletion = useRef<HTMLDialogElement>(null);
  const requestVersion = useRef(0);
  const query = useCallback(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters))
      if (value) params.set(key, String(value));
    return params;
  }, [filters]);
  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const [result, meta] = await Promise.all([
          api(taskId ? `${base}/${taskId}` : `${base}?${query()}`, {
            signal: controller.signal,
          }),
          api(`${base}/context`, { signal: controller.signal }),
        ]);
        if (version !== requestVersion.current) return;
        setContext(meta.data);
        setLoadedAt(Date.now());
        if (taskId) setTask(result.data);
        else {
          setRows(result.data);
          setCursor(result.meta?.nextCursor ?? null);
        }
      } catch (e) {
        if (!controller.signal.aborted && version === requestVersion.current)
          setError(e instanceof Error ? e.message : "Could not load tasks.");
      } finally {
        if (!controller.signal.aborted && version === requestVersion.current)
          setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [base, taskId, query, revision]);
  async function loadMore() {
    const version = requestVersion.current;
    setBusy(true);
    setError("");
    try {
      const params = query();
      params.set("cursor", cursor!);
      const result = await api(`${base}?${params}`);
      if (version === requestVersion.current) {
        setRows((old) => [...old, ...result.data]);
        setCursor(result.meta?.nextCursor ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load tasks.");
    } finally {
      setBusy(false);
    }
  }
  async function changeStatus(status: TaskDTO["status"]) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api(`${base}/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setTask(result.data);
      setNotice("Task status saved.");
      setRevision((v) => v + 1);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not update status. Refresh to check before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api(`${base}/${taskId}`, { method: "DELETE" });
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
  const options = context?.options;
  function assignee(row: TaskDTO) {
    return !row.assignedToUserId
      ? "Unassigned"
      : (options?.members.find((m) => m.userId === row.assignedToUserId)
          ?.name ?? "Former team member");
  }
  function event(row: TaskDTO) {
    return options?.events.find((e) => e.id === row.eventId);
  }
  const overdue = (row: TaskDTO) =>
    row.status !== "COMPLETED" &&
    row.dueDate &&
    Date.parse(row.dueDate) < loadedAt;
  return (
    <div className="space-y-7">
      {taskId ? (
        <Link href={pageBase} className="text-label-lg text-secondary">
          ← Back to tasks
        </Link>
      ) : (
        <p className="text-xs uppercase tracking-widest text-secondary">
          Your wedding checklist
        </p>
      )}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words font-serif text-display-sm text-primary">
            {taskId ? (task?.title ?? "Task details") : "Wedding Tasks"}
          </h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            {taskId
              ? "Keep the details together and your team in the loop."
              : "Keep track of everything your family needs to get done across all celebrations."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(!taskId || task) && (
            <button
              disabled={!context || loading}
              className={eventButton}
              onClick={() => setEditor(taskId ? { task: task! } : {})}
            >
              {taskId ? "Edit task" : "+ Add task"}
            </button>
          )}
          {task && taskId && (
            <button
              disabled={busy}
              className={secondary}
              onClick={() => deletion.current?.showModal()}
            >
              Delete task
            </button>
          )}
        </div>
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-error-container p-4 text-on-error-container"
        >
          {error}{" "}
          <button
            className="ml-3 underline"
            onClick={() => setRevision((v) => v + 1)}
          >
            Refresh
          </button>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-tertiary-fixed/50 p-3 text-tertiary"
        >
          {notice}
        </p>
      )}
      {loading && <p role="status">Loading tasks…</p>}
      {!taskId && context && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {(
              [
                ["Total tasks", context.summary.total],
                ["To do", context.summary.todo],
                ["In progress", context.summary.inProgress],
                ["Done", context.summary.completed],
                ["Overdue", context.summary.overdue],
              ] as const
            ).map(([label, count]) => (
              <div className="rounded-xl bg-white p-4" key={label}>
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                  {label}
                </p>
                <p className="mt-3 font-serif text-3xl text-primary">{count}</p>
              </div>
            ))}
          </div>
          <section aria-label="Task filters" className={card}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-label-lg">
                Search tasks
                <input
                  className={field}
                  value={filters.q}
                  maxLength={200}
                  placeholder="Search by title"
                  onChange={(e) =>
                    setFilters({ ...filters, q: e.target.value })
                  }
                />
              </label>
              <label className="text-label-lg">
                Assignee
                <select
                  className={field}
                  value={filters.assignedToUserId}
                  onChange={(e) =>
                    setFilters({ ...filters, assignedToUserId: e.target.value })
                  }
                >
                  <option value="">Everyone</option>
                  {options?.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
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
                  {options?.events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-label-lg">
                Status
                <select
                  className={field}
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <option value="">All statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {labels[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-label-lg">
                Priority
                <select
                  className={field}
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters({ ...filters, priority: e.target.value })
                  }
                >
                  <option value="">All priorities</option>
                  {priorities.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-end gap-4">
                <label className="flex items-center gap-2 py-3 text-label-lg">
                  <input
                    type="checkbox"
                    checked={filters.overdue}
                    onChange={(e) =>
                      setFilters({ ...filters, overdue: e.target.checked })
                    }
                  />
                  Overdue only
                </label>
                <button
                  className={secondary}
                  onClick={() => setFilters(blankFilters)}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>
          {!loading && rows.length === 0 && (
            <div className={`${card} text-center`}>
              <h2 className="font-serif text-2xl text-primary">
                {Object.values(filters).some(Boolean)
                  ? "No tasks match these filters"
                  : "A little planning, a lot more together"}
              </h2>
              <p className="mt-3 text-on-surface-variant">
                {Object.values(filters).some(Boolean)
                  ? "Try adjusting your filters."
                  : "Add your first task and share the responsibilities with your wedding team."}
              </p>
            </div>
          )}
          <div className="space-y-3" aria-busy={loading}>
            {rows.map((row) => (
              <article
                className="flex flex-col gap-4 rounded-xl bg-white p-5 sm:flex-row sm:items-center"
                key={row.id}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`${pageBase}/${row.id}`}
                      className={`break-words font-semibold text-primary ${row.status === "COMPLETED" ? "line-through" : ""}`}
                    >
                      {row.title}
                    </Link>
                    <Badge status={row.status} />
                    {overdue(row) && (
                      <span className="text-xs font-semibold text-secondary">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="mt-2 break-words text-body-sm text-on-surface-variant">
                    {event(row)?.name ?? "General wedding"}
                    {row.description
                      ? ` · ${row.description.slice(0, 160)}`
                      : ""}
                  </p>
                </div>
                <div className="text-body-sm">
                  <p className="break-words font-semibold">{assignee(row)}</p>
                  <p className="mt-1 text-on-surface-variant">
                    {dateLabel(row.dueDate)}
                  </p>
                  <p className="mt-1 text-xs">{row.priority} priority</p>
                </div>
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
              className={secondary}
              disabled={busy || loading}
              onClick={loadMore}
            >
              {busy ? "Loading…" : "Load more tasks"}
            </button>
          )}
          <footer className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-container-low p-6">
            <div>
              <h2 className="font-semibold">Sharing responsibilities</h2>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                Assign tasks so everyone knows what to take care of.
              </p>
            </div>
            <Link
              href={`/app/weddings/${weddingId}/team`}
              className="text-label-lg text-primary"
            >
              View team →
            </Link>
          </footer>
        </>
      )}
      {taskId && task && options && (
        <>
          <section className={`${card} space-y-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-primary">
                Task progression
              </h2>
              <Badge status={task.status} />
            </div>
            <div className="grid gap-2 rounded-lg bg-surface-container-low p-2 sm:grid-cols-3">
              {statuses.map((status, i) => (
                <button
                  aria-pressed={task.status === status}
                  disabled={busy || loading}
                  onClick={() => changeStatus(status)}
                  key={status}
                  className={`rounded-lg p-4 text-left font-semibold disabled:opacity-50 ${task.status === status ? "bg-primary-container text-white" : "hover:bg-white"}`}
                >
                  {i + 1}. {labels[status]}
                </button>
              ))}
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Last updated {dateLabel(task.updatedAt)}
              {task.completedAt
                ? ` · Completed ${dateLabel(task.completedAt)}`
                : ""}
            </p>
            <button
              className={eventButton}
              disabled={busy || loading}
              onClick={() =>
                changeStatus(task.status === "COMPLETED" ? "TODO" : "COMPLETED")
              }
            >
              {busy
                ? "Saving…"
                : task.status === "COMPLETED"
                  ? "Reopen task"
                  : "Mark as done"}
            </button>
          </section>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <section className={`${card} space-y-6`}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h2 className="text-xs uppercase tracking-widest text-secondary">
                    Assigned to
                  </h2>
                  <p className="mt-3 break-words font-semibold">
                    {assignee(task)}
                  </p>
                </div>
                <div>
                  <h2 className="text-xs uppercase tracking-widest text-secondary">
                    Target timeline
                  </h2>
                  <p className="mt-3 font-semibold">
                    {dateLabel(task.dueDate)}
                  </p>
                  {overdue(task) && (
                    <p className="mt-2 text-secondary">Overdue</p>
                  )}
                  <p className="mt-2 text-body-sm">Priority: {task.priority}</p>
                </div>
              </div>
              <div className="border-t border-outline-variant/30 pt-5">
                <h2 className="text-xs uppercase tracking-widest text-secondary">
                  Task description &amp; brief
                </h2>
                <p className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-surface-container-low p-4 text-body-md">
                  {task.description || "No description added."}
                </p>
              </div>
            </section>
            <section className={`${card} space-y-4`}>
              <p className="text-xs uppercase tracking-widest text-secondary">
                Connected celebration
              </p>
              <h2 className="break-words font-serif text-2xl text-primary">
                {event(task)?.name ?? "General wedding task"}
              </h2>
              {event(task) ? (
                <>
                  <p className="text-body-md">
                    {dateLabel(event(task)!.startsAt)}
                  </p>
                  {event(task)!.venue && (
                    <p className="break-words text-body-md">
                      {event(task)!.venue}
                    </p>
                  )}
                  <Link
                    className={secondary + " inline-block"}
                    href={`/app/weddings/${weddingId}/events/${task.eventId}`}
                  >
                    View event details →
                  </Link>
                </>
              ) : (
                <p className="text-body-md text-on-surface-variant">
                  This task is not linked to a ceremony.
                </p>
              )}
            </section>
          </div>
        </>
      )}
      {editor && options && (
        <TaskEditor
          base={base}
          options={options}
          task={editor.task}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setNotice("Task saved.");
            setRevision((v) => v + 1);
          }}
        />
      )}
      <dialog
        ref={deletion}
        aria-labelledby="delete-task-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl p-6 backdrop:bg-black/40"
      >
        <h2 id="delete-task-title" className="font-serif text-2xl text-primary">
          Delete this task?
        </h2>
        <p className="mt-4 break-words">
          “{task?.title}” will be removed from your checklist. This cannot be
          undone.
        </p>
        <p className="mt-3 text-body-sm">
          The related event will remain unchanged.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            disabled={busy}
            className={secondary}
            onClick={() => deletion.current?.close()}
          >
            Cancel
          </button>
          <button disabled={busy} className={eventButton} onClick={remove}>
            {busy ? "Deleting…" : "Confirm delete"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
function TaskEditor({
  base,
  task,
  options,
  onClose,
  onSaved,
}: {
  base: string;
  task?: TaskDTO;
  options: TaskOptions;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unknown, setUnknown] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const due = String(data.get("dueDate") ?? "");
    const input = {
      title: data.get("title"),
      description: data.get("description"),
      eventId: data.get("eventId") || null,
      assignedToUserId: data.get("assignedToUserId") || null,
      dueDate: due ? new Date(`${due}:00+05:30`).toISOString() : null,
      priority: data.get("priority"),
      status: data.get("status"),
    };
    // Preserve historical assignment without trying to assign a removed member again.
    const payload: Record<string, unknown> = { ...input };
    if (task && payload.assignedToUserId === task.assignedToUserId)
      delete payload.assignedToUserId;
    try {
      const response = await fetch(task ? `${base}/${task.id}` : base, {
        method: task ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = await response.json();
        setError(result.error?.message ?? "Unable to save this task.");
      } else onSaved();
    } catch {
      setUnknown(true);
      setError(
        "The save could not be confirmed. Close this form and refresh the task list before trying again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="task-editor-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
      onClose={onClose}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border-t-4 border-primary-container p-5 backdrop:bg-primary/30 sm:p-8"
    >
      <h2 id="task-editor-title" className="font-serif text-3xl text-primary">
        {task ? "Edit task" : "Add task"}
      </h2>
      <p className="mt-2 text-body-md text-on-surface-variant">
        Share responsibilities with your wedding crew.
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
          Task title
          <input
            name="title"
            className={field}
            required
            maxLength={200}
            defaultValue={task?.title}
            autoFocus
          />
        </label>
        <label className="block text-label-lg">
          Description (optional)
          <textarea
            name="description"
            className={field}
            rows={3}
            maxLength={2000}
            defaultValue={task?.description}
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-label-lg">
            Assign to
            <select
              name="assignedToUserId"
              className={field}
              defaultValue={task?.assignedToUserId ?? ""}
            >
              <option value="">Unassigned</option>
              {task?.assignedToUserId &&
                !options.members.some(
                  (m) => m.userId === task.assignedToUserId,
                ) && (
                  <option value={task.assignedToUserId}>
                    Former team member (keep)
                  </option>
                )}
              {options.members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} · {m.role === "ADMIN" ? "Admin" : "Manager"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-label-lg">
            Due date &amp; time (IST)
            <input
              name="dueDate"
              type="datetime-local"
              className={field}
              defaultValue={localInput(task?.dueDate ?? null)}
            />
          </label>
        </div>
        <label className="block text-label-lg">
          Related event
          <select
            name="eventId"
            className={field}
            defaultValue={task?.eventId ?? ""}
          >
            <option value="">General wedding</option>
            {options.events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-label-lg">
            Priority
            <select
              name="priority"
              className={field}
              defaultValue={task?.priority ?? "MEDIUM"}
            >
              {priorities.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="text-label-lg">
            Status
            <select
              name="status"
              className={field}
              defaultValue={task?.status ?? "TODO"}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-outline-variant/30 pt-5">
          <button
            type="button"
            className={secondary}
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className={eventButton} disabled={busy || unknown}>
            {busy ? "Saving…" : task ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
