"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type {
  TeamInvitationDTO,
  TeamMemberDTO,
  TeamRole,
} from "@/modules/team/dto";
const button =
  "rounded-lg bg-primary-container px-5 py-3 font-semibold text-white disabled:opacity-50";
const secondary =
  "rounded-lg border border-outline-variant px-4 py-3 text-primary disabled:opacity-50";
type Action =
  | { kind: "invite"; role: TeamRole }
  | { kind: "remove" | "revoke"; id: string; name: string };
async function request<T>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    cache: "no-store",
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const result = response.status === 204 ? {} : await response.json();
  if (!response.ok)
    throw new Error(result.error?.message ?? "Unable to update the team.");
  return result.data;
}
function status(invite: TeamInvitationDTO) {
  if (invite.acceptedAt) return "Accepted";
  if (invite.revokedAt) return "Revoked";
  if (new Date(invite.expiresAt) <= new Date()) return "Expired";
  return invite.deliveryState === "SENT"
    ? "Pending acceptance"
    : invite.deliveryState === "FAILED"
      ? "Sending failed"
      : "Sending not confirmed";
}
export function TeamPanel({
  weddingId,
  role,
}: {
  weddingId: string;
  role: TeamRole;
}) {
  const base = `/api/v1/weddings/${weddingId}`;
  const admin = role === "ADMIN";
  const [members, setMembers] = useState<TeamMemberDTO[]>([]);
  const [invites, setInvites] = useState<TeamInvitationDTO[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const refresh = useCallback(async () => {
    const [people, invitations] = await Promise.all([
      request<TeamMemberDTO[]>(`${base}/members`),
      admin
        ? request<TeamInvitationDTO[]>(`${base}/member-invitations`)
        : Promise.resolve([]),
    ]);
    setMembers(people);
    setInvites(invitations);
    setLoaded(true);
  }, [admin, base]);
  useEffect(() => {
    // Fetching external team state on mount is intentional; updates follow the response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh().catch(() =>
      setError("Unable to load the team. Try Refresh."),
    );
  }, [refresh]);
  useEffect(() => {
    if (action) dialog.current?.showModal();
    else dialog.current?.close();
  }, [action]);
  async function run(work: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      setAction(null);
      setNotice(success);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Check your connection and refresh before trying again.",
      );
    } finally {
      try {
        await refresh();
      } catch {
        setError(
          "Unable to refresh. Check the team before retrying your last action.",
        );
      }
      setBusy(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    if (action.kind === "invite") {
      const email = String(new FormData(event.currentTarget).get("email") ?? "")
        .trim()
        .toLowerCase();
      void run(
        () =>
          request(`${base}/member-invitations`, "POST", {
            email,
            role: action.role,
          }),
        "Invitation sent to the email provider. Membership starts after acceptance.",
      );
    } else
      void run(
        () =>
          request(
            `${base}/${action.kind === "remove" ? "members" : "member-invitations"}/${action.id}`,
            "DELETE",
          ),
        action.kind === "remove"
          ? "Manager access removed."
          : "Invitation revoked.",
      );
  }
  const pending = invites.filter(
    (i) => !i.acceptedAt && !i.revokedAt && new Date(i.expiresAt) > new Date(),
  );
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-secondary">
            Your people, together
          </p>
          <h1 className="mt-2 font-headline-lg text-headline-lg text-primary">
            Team &amp; Access
          </h1>
          <p className="mt-3 max-w-xl text-on-surface-variant">
            Share the planning with your partner and the people you trust.
          </p>
          <p className="mt-3 text-sm">
            {admin
              ? "Admin access · Manage your wedding team"
              : "Manager access · Team directory is read-only"}
          </p>
        </div>
        {admin && (
          <div className="flex flex-wrap gap-3">
            <button
              className={secondary}
              onClick={() => {
                setError("");
                setAction({ kind: "invite", role: "MANAGER" });
              }}
            >
              Invite Manager
            </button>
            <button
              className={button}
              onClick={() => {
                setError("");
                setAction({ kind: "invite", role: "ADMIN" });
              }}
            >
              Invite Partner
            </button>
          </div>
        )}
      </div>
      {!action && error && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-error-container p-4 text-on-error-container"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-5 rounded-lg bg-tertiary-fixed/40 p-4">
          {notice}
        </p>
      )}
      <div className="my-7 grid gap-4 sm:grid-cols-3">
        {[
          ["Admins", members.filter((m) => m.role === "ADMIN").length],
          ["Managers", members.filter((m) => m.role === "MANAGER").length],
          ...(admin ? [["Pending invitations", pending.length]] : []),
        ].map(([label, count]) => (
          <div key={label} className="rounded-xl bg-white p-5">
            <p className="text-sm text-on-surface-variant">{label}</p>
            <p className="mt-2 text-3xl text-primary">{loaded ? count : "—"}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md">Wedding team</h2>
        <button
          className={secondary}
          disabled={busy}
          onClick={() => {
            setError("");
            void refresh().catch(() => setError("Unable to refresh the team."));
          }}
        >
          Refresh
        </button>
      </div>
      <ul className="divide-y divide-outline-variant/30 rounded-xl bg-white">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <div className="min-w-0">
              <p className="break-words font-semibold">{member.displayName}</p>
              <p className="mt-1 break-all text-sm text-on-surface-variant">
                {member.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="rounded-full bg-secondary-fixed/50 px-3 py-1 text-sm">
                {member.role === "ADMIN" ? "Admin" : "Manager"}
              </span>
              {admin && member.role === "MANAGER" && (
                <button
                  className="text-error underline"
                  onClick={() => {
                    setError("");
                    setAction({
                      kind: "remove",
                      id: member.id,
                      name: member.displayName,
                    });
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {admin && (
        <section className="mt-8">
          <h2 className="font-headline-md text-headline-md">Invitations</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Up to 200 recent invitations. Expired records are automatically
            cleared. Resending replaces the previous link.
          </p>
          {loaded && !invites.length && (
            <p className="mt-4 rounded-xl border border-dashed border-outline-variant p-8 text-center">
              Your planning circle starts here. Invite your partner or a
              Manager.
            </p>
          )}
          <ul className="mt-4 space-y-3">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5"
              >
                <div className="min-w-0">
                  <p className="break-all font-semibold">{invite.email}</p>
                  <p className="mt-2 text-sm">
                    {invite.role === "ADMIN" ? "Admin" : "Manager"} ·{" "}
                    {status(invite)}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Expires{" "}
                    {new Date(invite.expiresAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                {!invite.acceptedAt && !invite.revokedAt && (
                  <div className="flex gap-4">
                    <button
                      disabled={busy}
                      className="text-primary underline disabled:opacity-50"
                      onClick={() =>
                        void run(
                          () =>
                            request(
                              `${base}/member-invitations/${invite.id}/resend`,
                              "POST",
                            ),
                          "Replacement invitation sent to the email provider.",
                        )
                      }
                    >
                      Resend invitation
                    </button>
                    <button
                      className="text-error underline"
                      disabled={busy}
                      onClick={() => {
                        setError("");
                        setAction({
                          kind: "revoke",
                          id: invite.id,
                          name: invite.email,
                        });
                      }}
                    >
                      Revoke
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <aside className="mt-8 rounded-xl bg-secondary-fixed/30 p-6">
        <h2 className="font-semibold">A little clarity on access</h2>
        <p className="mt-2 text-sm leading-6">
          Admins and Managers can use the wedding’s planning features. Admins
          also invite and remove Managers and invite a co-admin. Admins cannot
          be removed in this version. Roles apply to this wedding; everyone can
          create their own wedding.
        </p>
      </aside>
      <dialog
        aria-labelledby="team-dialog-title"
        ref={dialog}
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setAction(null);
        }}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-on-surface shadow-xl backdrop:bg-black/40 sm:p-9"
      >
        {action && (
          <form onSubmit={submit} className="space-y-5">
            <p className="text-xs uppercase tracking-widest text-secondary">
              Team &amp; Access
            </p>
            <h2
              id="team-dialog-title"
              className="font-headline-md text-headline-md text-primary"
            >
              {action.kind === "invite"
                ? action.role === "ADMIN"
                  ? "Invite your partner"
                  : "Invite a Manager"
                : action.kind === "remove"
                  ? "Remove Manager?"
                  : "Revoke invitation?"}
            </h2>
            {action.kind === "invite" ? (
              <>
                <p className="text-sm leading-6">
                  {action.role === "ADMIN"
                    ? "Your partner will become an equal Admin after accepting. They can manage the team and all wedding information. Admin access cannot be removed in this version."
                    : "A Manager can access and edit your wedding’s planning information, but cannot invite or remove team members."}
                </p>
                <label className="block">
                  Email address
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    disabled={busy}
                    className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-low p-3"
                    placeholder="partner@example.com"
                  />
                </label>
                <p className="text-sm text-on-surface-variant">
                  They must sign in with this email address. The invitation
                  expires in 7 days.
                </p>
              </>
            ) : (
              <>
                <p className="break-all font-semibold">{action.name}</p>
                <p className="text-sm leading-6">
                  {action.kind === "remove"
                    ? "They will lose access to this wedding. Their account and historical planning information will stay intact."
                    : "This link will stop working. You can send a new invitation later."}
                </p>
              </>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-error-container p-3 text-on-error-container"
              >
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                className={secondary}
                onClick={() => setAction(null)}
              >
                Cancel
              </button>
              <button disabled={busy} className={button}>
                {busy
                  ? "Working…"
                  : action.kind === "invite"
                    ? "Send invitation"
                    : action.kind === "remove"
                      ? "Remove Manager"
                      : "Revoke invitation"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
